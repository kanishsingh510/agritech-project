const express = require('express');
const router = express.Router();
const { ensureBuyer, renderMarketplace, renderDashboard, renderCart } = require('../controllers/buyerController');

router.get('/marketplace', ensureBuyer, renderMarketplace);
router.get('/dashboard', ensureBuyer, renderDashboard);
router.get('/cart', ensureBuyer, renderCart);

module.exports = router;







