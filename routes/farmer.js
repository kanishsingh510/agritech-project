const express = require('express');
const router = express.Router();
const { upload, ensureFarmer, renderDashboard, getProductDetails, createProduct, updateProduct, deleteProduct, renderOrders, updateOrderStatus, renderAnalytics, getAnalyticsData } = require('../controllers/farmerController');

router.get('/dashboard', ensureFarmer, renderDashboard);
router.get('/analytics', ensureFarmer, renderAnalytics);
router.get('/api/analytics', ensureFarmer, getAnalyticsData);
router.get('/orders', ensureFarmer, renderOrders);
router.post('/orders/:id/status', ensureFarmer, updateOrderStatus);
router.get('/products/:id', ensureFarmer, getProductDetails);
router.post('/products', ensureFarmer, upload.single('image'), createProduct);
router.post('/products/:id', ensureFarmer, upload.single('image'), updateProduct);
router.delete('/products/:id', ensureFarmer, deleteProduct);

module.exports = router;


