const PassportLocalStrategy = require('passport-local').Strategy;
const { createChannel } = require('../../lbrynet');
const logger = require('winston');
const db = require('../../models');
const { publishing: { closedRegistration } } = require('@config/siteConfig');

module.exports = new PassportLocalStrategy(
  {
    usernameField    : 'username',
    passwordField    : 'password',
    passReqToCallback: true,
  },
  async (req, username, password, done) => {
    logger.info('username:', username);
    logger.info('password:', password);
    logger.info('channelName', req.body.channelName);
    logger.info('channelId', req.body.channelId);

    return done(null, {thing: 'hai'});
  }
);
