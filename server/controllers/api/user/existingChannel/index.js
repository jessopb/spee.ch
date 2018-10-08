const logger = require('winston');
const db = require('../../../../models');

const existingChannelAccount = async ({ body }, res) => {
  const { channelName, channelId, password } = body;
  logger.info('existing channel account', body);

  res.status(200).json({body});

  const userData = {
    userName: channelName,
    password: password,
  };

  const channelData = {
    channelName   : `@${channelName}`,
    channelClaimId: channelId,
  };

  const certificateData = {
    claimId: channelId,
    name   : `@${channelName}`,
  };

  let newUser, newChannel, newCertificate;

  try {
    [newUser, newChannel, newCertificate] = await Promise.all([
      db.User.create(userData),
      db.Channel.create(channelData),
      db.Certificate.create(certificateData),
    ]);
  } catch (error) {
    logger.error('ERROR adding user, channel, certificate', error);
    res.status(400).json({
      success: false,
      message: error,
    });
  }
  logger.info('newUser, newChannel, newCertificate created');

  try {
    await Promise.all([
      newCertificate.setChannel(newChannel),
      newChannel.setUser(newUser),
    ]);
  } catch (error) {
    logger.error('ERROR associating channel, user', error);
    res.status(400).json({
      success: false,
      message: error,
    });
  }
  logger.info('channel, user successfully associated');

  res.send(200).json({
    success: true,
    message: 'an account has been created and associated with your channel',
  });
};

module.exports = existingChannelAccount;
