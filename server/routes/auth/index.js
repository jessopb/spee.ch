const speechPassport = require('../../speechPassport');
const handleSignupRequest = require('../../controllers/auth/signup');
const handleLoginRequest = require('../../controllers/auth/login');
const handleLogoutRequest = require('../../controllers/auth/logout');
const handleUserRequest = require('../../controllers/auth/user');
const logger = require('winston');

module.exports = (app) => {
  app.post('/signup', speechPassport.authenticate('local-signup'), handleSignupRequest);
  app.post('/login', handleLoginRequest);
  app.get('/logout', handleLogoutRequest);
  app.get('/user', handleUserRequest);
  app.post('/existing-channel-signup', /*speechPassport.authenticate('existing-channel-signup'),*/ (req, res) => {
    logger.info('HAI', req);
    res.status(200).json({
      success: true,
      message: req.body,
    });
  });
};
