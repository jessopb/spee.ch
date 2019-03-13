const logger = require('winston');

const db = require('../../models');
const chainquery = require('chainquery').default;

const getClaimIdByChannel = async (channelName, channelClaimId, claimName) => {
  logger.debug(`getClaimIdByChannel(${channelName}, ${channelClaimId}, ${claimName})`);

  let channelId = await chainquery.claim.queries.getLongClaimId(channelName, channelClaimId);
  // Do we need a lbrynet call here?
  if (channelId === null) {
    channelId = await db.Certificate.getLongChannelId(channelName, channelClaimId);
  }

  let claimId = await chainquery.claim.queries.getClaimIdByLongChannelId(channelId, claimName);
  // Remove this
  //     if (claimId === null) {
  //       claimId = db.Claim.getClaimIdByLongChannelId(channelId, claimName);
  //     }

  return claimId;
};

const getClaimId = async (channelName, channelClaimId, name, claimId) => {
  logger.debug(`getClaimId: ${channelName}, ${channelClaimId}, ${name}, ${claimId})`);
  if (channelName) {
    return getClaimIdByChannel(channelName, channelClaimId, name);
  } else {
    let claimIdResult = await chainquery.claim.queries.getLongClaimId(name, claimId);
    // remove this:
    // if (!claimIdResult) {
    //   claimIdResult = await db.Claim.getLongClaimId(name, claimId);
    // }

    return claimIdResult;
  }
};

module.exports = getClaimId;
