const logger = require('winston');
const { details, publishing } = require('@config/siteConfig');

const createThumbnailPublishParams = (thumbnailFilePath, claimName, license, licenseUrl, nsfw) => {
  if (!thumbnailFilePath) {
    return;
  }
  logger.debug(`Creating Thumbnail Publish Parameters`);
  // create the publish params
  return {
    name: `${claimName}-thumb`,
    file_path: thumbnailFilePath,
    bid: publishing.fileClaimBidAmount,
    metadata: {
      title: `${claimName} thumbnail`,
      description: `a thumbnail for ${claimName}`,
      author: details.title,
      language: 'en',
      license,
      licenseUrl,
      nsfw,
    },
    claim_address: publishing.primaryClaimAddress,
    channel_name: publishing.thumbnailChannel,
    channel_id: publishing.thumbnailChannelId,
  };
};

module.exports = createThumbnailPublishParams;
