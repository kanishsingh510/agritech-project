const express = require('express');
const router = express.Router();
const { 
  renderLogin, 
  renderSignup, 
  signup, 
  login, 
  logout, 
  seedDemo, 
  validateSignup, 
  checkEmailExists,
  ensureAuth,
  getNotifications,
  markNotificationRead
} = require('../controllers/authController');

// Public routes
router.get('/login', renderLogin);
router.post('/login', login);
router.get('/signup', renderSignup);
router.post('/signup', validateSignup, signup);
router.post('/logout', logout);
router.get('/seed', seedDemo);

// API endpoints
router.get('/api/check-email', checkEmailExists);

// Notifications (Shared between roles)
router.get('/notifications', ensureAuth, getNotifications);
router.post('/notifications/:id/read', ensureAuth, markNotificationRead);

module.exports = router;


