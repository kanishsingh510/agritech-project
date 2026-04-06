const Product = require('../models/product');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

const ensureBuyer = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'buyer') return res.redirect('/login');
  next();
};

const renderMarketplace = async (req, res, next) => {
  try {
    const { category, q, sort } = req.query;
    const filter = {};
    if (category && category !== 'All') filter.category = category.toLowerCase();
    if (q) filter.name = { $regex: q, $options: 'i' };
    let sortBy = { createdAt: -1 };
    if (sort === 'price_asc') sortBy = { price: 1 };
    if (sort === 'price_desc') sortBy = { price: -1 };
    const products = await Product.find(filter).sort(sortBy).populate('farmerId', 'name location');
    res.render('buyer/marketplace', { products, category: category || 'All', q: q || '', sort: sort || 'newest' });
  } catch (err) {
    next(err);
  }
};

const renderDashboard = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyerId: req.session.user._id }).populate('productId').sort({ createdAt: -1 });
    res.render('buyer/dashboard', { orders });
  } catch (err) {
    next(err);
  }
};

const renderCart = (req, res) => {
  res.render('buyer/cart');
};

const renderCheckout = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId).populate('farmerId', 'name');
    if (!product) return res.status(404).send('Product not found');
    res.render('buyer/checkout', { product });
  } catch (err) {
    next(err);
  }
};

const placeOrder = async (req, res, next) => {
  try {
    const { productId, name, phone, address, quantity } = req.body;
    const qty = Number(quantity);
    if (qty < 1) return res.status(400).send('Invalid quantity');

    const product = await Product.findById(productId);
    if (!product) return res.status(404).send('Product not found');
    
    const totalPrice = product.price * qty;

    const order = new Order({
      productId: product._id,
      farmerId: product.farmerId,
      buyerId: req.session.user._id,
      buyerDetails: { name, phone, address },
      quantity: qty,
      totalPrice
    });
    await order.save();

    const notif = new Notification({
      userId: product.farmerId,
      message: `New order placed for ${qty}x ${product.name}`,
      type: 'new_order',
      relatedOrderId: order._id
    });
    await notif.save();

    res.redirect('/buyer/dashboard?success=order_placed');
  } catch (err) {
    next(err);
  }
};

module.exports = { ensureBuyer, renderMarketplace, renderDashboard, renderCart, renderCheckout, placeOrder };







