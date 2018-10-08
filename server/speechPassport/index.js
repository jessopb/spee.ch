const passport = require('passport');
const localLoginStrategy = require('./utils/local-login.js');
const localSignupStrategy = require('./utils/local-signup.js');
const existingChannelSignUpStrategy = require('./utils/existing-channel-signup');
const serializeUser = require('./utils/serializeUser.js');
const deserializeUser = require('./utils/deserializeUser.js');

passport.deserializeUser(deserializeUser);
passport.serializeUser(serializeUser);
passport.use('local-login', localLoginStrategy);
passport.use('local-signup', localSignupStrategy);
passport.use('existing-channel-signup', existingChannelSignUpStrategy);

module.exports = passport;
