const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Apply auth and admin middleware to all routes
router.use(auth);
router.use(admin);

// Dashboard statistics
router.get('/dashboard', adminController.getDashboardStats);

// ... existing routes ...

module.exports = router; 