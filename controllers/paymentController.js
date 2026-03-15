const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Product = require('../models/product');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_12345',
  key_secret: process.env.RAZORPAY_SECRET || 'abc123'
});

const createOrder = async (req, res, next) => {
  try {
    const { productId, amount } = req.body;
    let amountPaise;
    let product;
    
    if (productId) {
      product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      amountPaise = Math.round(Number(product.price) * 100);
    } else if (amount) {
      amountPaise = Math.round(Number(amount));
    } else {
      return res.status(400).json({ error: 'Product ID or amount required' });
    }
    
    const order = await razorpay.orders.create({ amount: amountPaise, currency: 'INR' });
    
    if (product) {
      await Transaction.create({
        buyerId: req.session.user._id,
        farmerId: product.farmerId,
        productId: product._id,
        amount: product.price,
        paymentStatus: 'created',
        orderId: order.id
      });
    }
    
    res.json({ orderId: order.id, key: process.env.RAZORPAY_KEY_ID || 'rzp_test_12345', amount: amountPaise, currency: 'INR' });
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET || 'abc123')
      .update(body)
      .digest('hex');
    const isValid = expectedSignature === razorpay_signature;
    if (!isValid) return res.status(400).json({ success: false });

    await Transaction.findOneAndUpdate(
      { orderId: razorpay_order_id },
      { paymentStatus: 'paid', paymentId: razorpay_payment_id }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, verifyPayment };







