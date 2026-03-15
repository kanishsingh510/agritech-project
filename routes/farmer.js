const express = require('express');
const router = express.Router();
const { upload, ensureFarmer, renderDashboard, createProduct, updateProduct, deleteProduct } = require('../controllers/farmerController');

router.get('/dashboard', ensureFarmer, renderDashboard);
router.post('/products', ensureFarmer, upload.single('image'), createProduct);
router.post('/products/:id', ensureFarmer, upload.single('image'), updateProduct);
router.delete('/products/:id', ensureFarmer, deleteProduct);

module.exports = router;


