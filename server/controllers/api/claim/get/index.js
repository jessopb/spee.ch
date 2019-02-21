const { getClaim } = require('../../../../lbrynet');
const {
  createFileRecordDataAfterGet,
} = require('../../../../models/utils/createFileRecordData.js');
const { handleErrorResponse } = require('../../../utils/errorHandlers.js');
const getClaimData = require('server/utils/getClaimData');
const chainquery = require('chainquery').default;
const db = require('../../../../models');
const waitOn = require('wait-on');
const logger = require('winston');
const {
  serving: { maxKeyFeeInLBC = 0, maxKeyFeeInUSD = 0 },
} = require('@config/siteConfig');

/*

  route to get a claim

*/

const claimGet = async ({ ip, originalUrl, params }, res) => {
  const name = params.name;
  const claimId = params.claimId;

  try {
    let claimInfo = await chainquery.claim.queries.resolveClaim(name, claimId).catch(() => {});
    if (claimInfo) {
      logger.info('claim/get: claim resolved in chainquery');
    }
    console.log(claimInfo);
    if (!claimInfo) {
      claimInfo = await db.Claim.resolveClaim(name, claimId);
    }
    if (!claimInfo) {
      throw new Error('claim/get: resolveClaim: No matching uri found in Claim table');
    }
    const { fee = 0, fee_currency: feeCurrency = 'LBC' } =
      claimInfo.dataValues && claimInfo.dataValues;
    if (
      (feeCurrency === 'LBC' && fee > maxKeyFeeInLBC) ||
      (feeCurrency === 'USD' && fee > maxKeyFeeInUSD)
    ) {
      throw new Error(
        'claim/get: Fee higher than app settings allow. See settings documentation on raising maxKeyFeeIn___ limits'
      );
    }
    let lbrynetResult = await getClaim(`${name}#${claimId}`);
    console.log(lbrynetResult);
    if (!lbrynetResult) {
      throw new Error(`claim/get: getClaim Unable to Get ${name}#${claimId}`);
    }
    if (lbrynetResult.error) {
      if (lbrynetResult.error.includes('Unable to pay')) {
        throw new Error(`claim/get: getClaim Unable to Pay Fee for ${name}#${claimId}`);
      } else {
        throw new Error(
          `claim/get: Error getting ${name}#${claimId}. SDK error: ${lbrynetResult.error}`
        );
      }
    }
    const claimData = await getClaimData(claimInfo);
    if (!claimData) {
      throw new Error('claim/get: getClaimData failed to get file blobs');
    }
    await waitOn({
      resources: [lbrynetResult.download_path],
      timeout: 10000, // 10 seconds
      window: 500,
    });
    const fileData = await createFileRecordDataAfterGet(claimData, lbrynetResult);
    if (!fileData) {
      throw new Error('claim/get: createFileRecordDataAfterGet failed to create file in time');
    }
    const upsertCriteria = { name, claimId };
    await db.upsert(db.File, fileData, upsertCriteria, 'File');
    const { message, completed } = lbrynetResult;
    res.status(200).json({
      success: true,
      message,
      completed,
    });
  } catch (error) {
    handleErrorResponse(originalUrl, ip, error, res);
  }
};
module.exports = claimGet;
