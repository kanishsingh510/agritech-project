const express = require('express');
const router = express.Router();
const { ensureBuyer } = require('../controllers/buyerController');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

router.post('/create-order', ensureBuyer, createOrder);
router.post('/verify', ensureBuyer, verifyPayment);

module.exports = router;







