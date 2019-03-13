const logger = require('winston');

const db = require('../../../models');
const chainquery = require('chainquery').default;
const isApprovedChannel = require('../../../../utils/isApprovedChannel');
const { getFileListFileByOutpoint, getClaim } = require('server/lbrynet');
const getClaimId = require('../../utils/getClaimId.js');
const { handleErrorResponse } = require('../../utils/errorHandlers.js');
const awaitFileSize = require('server/utils/awaitFileSize');
const serveFile = require('./serveFile.js');
const parseQueryString = require('server/utils/parseQuerystring');

const NO_CHANNEL = 'NO_CHANNEL';
const NO_CLAIM = 'NO_CLAIM';
const BLOCKED_CLAIM = 'BLOCKED_CLAIM';
const NO_FILE = 'NO_FILE';
const CONTENT_UNAVAILABLE = 'CONTENT_UNAVAILABLE';

const {
  publishing: { serveOnlyApproved, approvedChannels },
} = require('@config/siteConfig');

const getClaimIdAndServeAsset = async (
  channelName,
  channelClaimId,
  claimName,
  claimId,
  originalUrl,
  ip,
  res,
  headers
) => {
  try {
    const queryObject = parseQueryString(originalUrl);
    const fullClaimId = await getClaimId(channelName, channelClaimId, claimName, claimId);
    // GET CLAIM DETAILS
    // const cacheOutpoint = publishCache.get(claimId);
    const cqResult = await chainquery.claim.queries.resolveClaim(claimName, fullClaimId);
    if (!cqResult || !cqResult.dataValues) {
      throw new Error(NO_CLAIM);
    }
    const cqData = cqResult.dataValues;
    const cqOutpoint = cqData.outpoint;
    // MAKE SURE WE SHOULD SERVE
    if (
      serveOnlyApproved &&
      !isApprovedChannel({ longId: cqData.publisher_id || cqData.certificateId }, approvedChannels)
    ) {
      throw new Error(CONTENT_UNAVAILABLE);
    }
    // The following throws "BLOCKED_CLAIM"
    await db.Blocked.isNotBlocked(cqData.outpoint);

    // MAKE SURE WE HAVE IT
    let fileListResult = await getFileListFileByOutpoint(cqData.outpoint);
    if (fileListResult && fileListResult[0] && fileListResult[0]['outpoint'] === cqData.outpoint) {
      serveFile(fileListResult[0], res, originalUrl);
    } else {
      let lbrynetResult = await getClaim(`${claimName}#${fullClaimId}`);
      if (!lbrynetResult || !lbrynetResult.claim_id) {
        throw new Error('LBRYNET_NO_GET');
      }
      let fileReady = await awaitFileSize(lbrynetResult.outpoint, 15000000, 250, 15000);
      if (fileReady !== 'ready') {
        throw new Error('claim/get: failed to get file after 10 seconds');
      }
      serveFile(lbrynetResult, res, originalUrl);
    }

    if (
      (headers && headers['user-agent'] && /LBRY/.test(headers['user-agent']) === false) ||
      (queryObject && !queryObject.hasOwnProperty('thumbnail'))
    ) {
      db.Views.create({
        time: Date.now(),
        isChannel: false,
        claimId: cqData.claim_id,
        publisherId: cqData.publisher_id,
        ip,
      });
    }
  } catch (error) {
    if (error === NO_CLAIM) {
      logger.debug('no claim found');
      return res.status(404).json({
        success: false,
        message: 'No matching claim id could be found for that url',
      });
    }
    if (error === NO_CHANNEL) {
      logger.debug('no channel found');
      return res.status(404).json({
        success: false,
        message: 'No matching channel id could be found for that url',
      });
    }
    if (error === CONTENT_UNAVAILABLE) {
      logger.debug('unapproved channel');
      return res.status(400).json({
        success: false,
        message: 'This content is unavailable',
      });
    }
    if (error === BLOCKED_CLAIM) {
      logger.debug('claim was blocked');
      return res.status(451).json({
        success: false,
        message:
          'In response to a complaint we received under the US Digital Millennium Copyright Act, we have blocked access to this content from our applications. For more details, see https://lbry.io/faq/dmca',
      });
    }
    if (error === NO_FILE) {
      logger.debug('no file available');
      return res.status(307).redirect(`/api/claim/get/${claimName}/${claimId}`);
    }
    handleErrorResponse(originalUrl, ip, error, res);
  }
};

module.exports = getClaimIdAndServeAsset;
