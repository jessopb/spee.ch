const logger = require('winston');
const transformImage = require('./transformImage');
const serveFile = async ({ filePath, fileType }, res, originalUrl) => {
  const queryObject = {};
  // TODO: replace quick/dirty try catch with better practice
  try {
    originalUrl
      .split('?')[1]
      .split('&')
      .map(pair => {
        if (pair.includes('=')) {
          let parr = pair.split('=');
          queryObject[parr[0]] = parr[1];
        } else queryObject[pair] = true;
      });
  } catch (e) {}

  if (!fileType) {
    logger.error(`no fileType provided for ${filePath}`);
  }

  let mediaType = fileType ? fileType.substr(0, fileType.indexOf('/')) : '';
  const transform =
    mediaType === 'image' && queryObject.hasOwnProperty('h') && queryObject.hasOwnProperty('w');

  const sendFileOptions = {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Content-Type': fileType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    },
  };
  logger.debug(`fileOptions for ${filePath}:`, sendFileOptions);
  if (transform) {
    logger.debug(`transforming and sending file`);

    let xformed = await transformImage(filePath, queryObject);
    res.status(200).set(sendFileOptions.headers);
    res.end(xformed, 'binary');
  } else {
    res.status(200).sendFile(filePath, sendFileOptions);
  }
};

module.exports = serveFile;
