const logger = require('winston');
const db = require('server/models');
const {
  details,
  publishing: { disabled, disabledMessage, primaryClaimAddress },
} = require('@config/siteConfig');
const { resolveUri } = require('server/lbrynet');
const { sendGATimingEvent } = require('../../../../utils/googleAnalytics.js');
const { handleErrorResponse } = require('../../../utils/errorHandlers.js');
const publish = require('../publish/publish.js');
const parsePublishApiRequestBody = require('../publish/parsePublishApiRequestBody');
const parsePublishApiRequestFiles = require('../publish/parsePublishApiRequestFiles.js');
const authenticateUser = require('../publish/authentication.js');
const createThumbnailPublishParams = require('../publish/createThumbnailPublishParams.js');
const chainquery = require('chainquery').default;
const createCanonicalLink = require('@globalutils/createCanonicalLink');

/*
  route to update a claim through the daemon
*/

const updateMetadata = ({ nsfw, license, licenseUrl, title, description }) => {
  const update = {};
  if (nsfw) update['nsfw'] = nsfw;
  if (license) update['license'] = license;
  if (licenseUrl) update['licenseUrl'] = licenseUrl;
  if (title) update['title'] = title;
  if (description) update['description'] = description;
  return update;
};

const rando = () => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i += 1) text += possible.charAt(Math.floor(Math.random() * 62));
  return text;
};

const claimUpdate = ({ body, files, headers, ip, originalUrl, user, tor }, res) => {
  // logging
  logger.info('Claim update request:', {
    ip,
    headers,
    body,
    files,
    user,
  });

  // check for disabled publishing
  if (disabled) {
    return res.status(503).json({
      success: false,
      message: disabledMessage,
    });
  }

  // define variables
  let channelName,
    channelId,
    channelPassword,
    description,
    fileName,
    filePath,
    fileType,
    gaStartTime,
    thumbnail,
    fileExtension,
    license,
    licenseUrl,
    name,
    nsfw,
    thumbnailFileName,
    thumbnailFilePath,
    thumbnailFileType,
    title,
    claimRecord,
    metadata,
    publishResult,
    thumbnailUpdate = false;
  // record the start time of the request
  gaStartTime = Date.now();

  try {
    ({
      name,
      nsfw,
      license,
      licenseUrl,
      title,
      description,
      thumbnail,
    } = parsePublishApiRequestBody(body));
    ({
      fileName,
      filePath,
      fileExtension,
      fileType,
      thumbnailFileName,
      thumbnailFilePath,
      thumbnailFileType,
    } = parsePublishApiRequestFiles(files, true));
    ({ channelName, channelId, channelPassword } = body);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  // check channel authorization
  authenticateUser(channelName, channelId, channelPassword, user)
    .then(({ channelName, channelClaimId }) => {
      if (!channelId) {
        channelId = channelClaimId;
      }
      return chainquery.claim.queries
        .resolveClaimInChannel(name, channelClaimId)
        .then(claim => claim.dataValues);
    })
    .then(claim => {
      claimRecord = claim;
      if (claimRecord.content_type === 'video/mp4' && files.file) {
        thumbnailUpdate = true;
      }
      // No need to resolve here? What do we do with File.findOne?
      if (!files.file || thumbnailUpdate) {
        return Promise.all([
          // Will be: return getFileListFileByClaimId(claimId)
          db.File.findOne({ where: { name, claimId: claim.claim_id } }),
          // resolveUri(`${claim.name}#${claim.claim_id}`),
        ]);
      }

      return [null, null];
    })
    .then(([fileResult, resolution]) => {
      metadata = Object.assign(
        {},
        {
          title: claimRecord.title,
          description: claimRecord.description,
          nsfw: claimRecord.nsfw,
          license: claimRecord.license,
          licenseUrl: claimRecord.license_url,
          language: 'en',
          author: details.title,
        },
        updateMetadata({ title, description, nsfw, license, licenseUrl })
      );
      const publishParams = {
        name,
        bid: '0.01',
        claim_address: primaryClaimAddress,
        channel_name: channelName,
        channel_id: channelId,
        metadata,
      };

      if (files.file) {
        if (thumbnailUpdate) {
          // publish new thumbnail
          const newThumbnailName = `${name}-${rando()}`;
          const newThumbnailParams = createThumbnailPublishParams(
            filePath,
            newThumbnailName,
            license,
            nsfw
          );
          newThumbnailParams['file_path'] = filePath;
          publish(newThumbnailParams, fileName, fileType);

          publishParams['thumbnail'] = `${details.host}/${newThumbnailParams.channel_name}:${
            newThumbnailParams.channel_id
          }/${newThumbnailName}-thumb.jpg`;
        } else {
          publishParams['file_path'] = filePath;
        }
      } else {
        // Here fileResult should be a file_list result.
        fileName = fileResult.fileName;
        fileType = fileResult.fileType;
        publishParams['thumbnail'] = claimRecord.thumbnail_url;
      }

      const fp = files && files.file && files.file.path ? files.file.path : undefined;
      return publish(publishParams, fileName, fileType, fp);
    })
    .then(result => {
      publishResult = result;

      if (channelName) {
        return chainquery.claim.queries.getShortClaimIdFromLongClaimId(
          result.certificateId,
          channelName
        );
      } else {
        return chainquery.claim.queries
          .getShortClaimIdFromLongClaimId(result.claimId, name, result)
          .catch(() => {
            return result.claimId.slice(0, 1);
          });
      }
    })
    .then(shortId => {
      let canonicalUrl;
      if (channelName) {
        canonicalUrl = createCanonicalLink({
          asset: { ...publishResult, channelShortId: shortId },
        });
      } else {
        canonicalUrl = createCanonicalLink({ asset: { ...publishResult, shortId } });
      }

      if (publishResult.error) {
        res.status(400).json({
          success: false,
          message: publishResult.message,
        });
      }

      const { claimId } = publishResult;
      res.status(200).json({
        success: true,
        message: 'update successful',
        data: {
          name,
          claimId,
          url: `${details.host}${canonicalUrl}`, // for backwards compatability with app
          showUrl: `${details.host}${canonicalUrl}`,
          serveUrl: `${details.host}${canonicalUrl}${fileExtension}`,
          pushTo: canonicalUrl,
          claimData: publishResult,
        },
      });
      // record the publish end time and send to google analytics
      sendGATimingEvent('end-to-end', 'update', fileType, gaStartTime, Date.now());
    })
    .catch(error => {
      handleErrorResponse(originalUrl, ip, error, res);
    });
};

module.exports = claimUpdate;
