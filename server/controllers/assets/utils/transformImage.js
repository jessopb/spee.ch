const gm = require('gm');
const imageMagick = gm.subClass({ imageMagick: true });
const { getImageHeightAndWidth } = require('../../../utils/imageProcessing');

module.exports = function transformImage(path, queryObj) {
  return new Promise((resolve, reject) => {
    let cHeight = queryObj.h || null;
    let cWidth = queryObj.w || null;
    let transform = queryObj.t || null;
    let oHeight,
      oWidth = null;

    getImageHeightAndWidth(path).then(hwarr => {
      oHeight = hwarr[0];
      oWidth = hwarr[1];
      // conditional logic here
      if (transform === 'crop') {
        return resolve(_cropCenter(path, cWidth, cHeight, oWidth, oHeight));
      } else {
        // resize scaled
        imageMagick(path)
          .resize(cWidth, cHeight)
          .toBuffer(null, (err, buf) => {
            return resolve(buf);
          });
      }
    });
  });
};

function _cropCenter(path, cropWidth, cropHeight, originalWidth, originalHeight) {
  return new Promise((resolve, reject) => {
    return imageMagick(path)
      .crop(
        cropWidth,
        cropHeight,
        originalWidth / 2 - cropWidth / 2,
        originalHeight / 2 - cropHeight / 2
      )
      .toBuffer(null, (err, buf) => {
        return resolve(buf);
      });
  });
}
