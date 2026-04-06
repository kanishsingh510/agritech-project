const express = require('express');
const router = express.Router();
const { ensureBuyer, renderMarketplace, renderDashboard, renderCart, renderCheckout, placeOrder, processCartCheckout } = require('../controllers/buyerController');

router.get('/marketplace', ensureBuyer, renderMarketplace);
router.get('/dashboard', ensureBuyer, renderDashboard);
router.get('/cart', ensureBuyer, renderCart);
router.get('/checkout/:productId', ensureBuyer, renderCheckout);
router.post('/order', ensureBuyer, placeOrder);
router.post('/cart/checkout', ensureBuyer, processCartCheckout);

module.exports = router;







