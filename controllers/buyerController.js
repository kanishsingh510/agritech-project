const Product = require('../models/product');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

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
    const txs = await Transaction.find({ buyerId: req.session.user._id }).populate('productId');
    res.render('buyer/dashboard', { transactions: txs });
  } catch (err) {
    next(err);
  }
};

const renderCart = (req, res) => {
  res.render('buyer/cart');
};

module.exports = { ensureBuyer, renderMarketplace, renderDashboard, renderCart };







