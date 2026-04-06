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
    const orders = await Order.find({ buyerId: req.session.user._id }).populate('items.productId').sort({ createdAt: -1 });
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
    
    // Validations
    if (!name || !/^[A-Za-z\s]+$/.test(name)) {
      return res.status(400).send('Invalid name: only alphabetic characters allowed');
    }
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).send('Enter valid 10-digit phone number');
    }
    if (!address || address.trim() === '') {
      return res.status(400).send('Address is required');
    }

    const qty = Number(quantity);
    if (qty < 1) return res.status(400).send('Invalid quantity');

    const product = await Product.findById(productId);
    if (!product) return res.status(404).send('Product not found');
    
    if (qty > product.stock) {
      return res.status(400).send('Low stock available');
    }
    
    const totalPrice = product.price * qty;

    const order = new Order({
      farmerId: product.farmerId,
      buyerId: req.session.user._id,
      items: [{
        productId: product._id,
        quantity: qty,
        price: product.price
      }],
      buyerDetails: { name, phone, address },
      totalPrice,
      paymentMethod: 'COD',
      status: 'pending'
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

const processCartCheckout = async (req, res, next) => {
  try {
    const { cart, buyerDetails } = req.body;
    
    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!buyerDetails || !buyerDetails.name || !buyerDetails.phone || !buyerDetails.address) {
      return res.status(400).json({ error: 'Incomplete buyer details' });
    }
    if (!/^[a-zA-Z\s]+$/.test(buyerDetails.name)) {
      return res.status(400).json({ error: 'Name should contain only characters' });
    }
    if (!/^[0-9]{10}$/.test(buyerDetails.phone)) {
      return res.status(400).json({ error: 'Enter valid 10-digit phone number' });
    }

    // group items by farmerId
    const groups = {};
    for (const item of cart) {
      if (!item.farmerId) return res.status(400).json({ error: 'Invalid product data: missing farmer identifier.'});
      
      // Stock guard natively mapped
      const product = await Product.findById(item.id);
      if (!product) return res.status(404).json({ error: 'Product not found: ' + item.name });
      if (item.quantity < 1) {
        return res.status(400).json({ error: `Invalid quantity for ${item.name}` });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({ error: `Only ${product.stock} items available in stock for ${item.name}` });
      }

      if (!groups[item.farmerId]) groups[item.farmerId] = { items: [], total: 0 };
      
      groups[item.farmerId].items.push({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      });
      groups[item.farmerId].total += (item.price * item.quantity);
    }

    // Instantiate grouped orders
    for (const [farmerId, group] of Object.entries(groups)) {
      const order = new Order({
        farmerId: farmerId,
        buyerId: req.session.user._id,
        items: group.items,
        buyerDetails: { ...buyerDetails },
        totalPrice: group.total,
        paymentMethod: 'COD',
        status: 'pending'
      });
      await order.save();

      const notif = new Notification({
        userId: farmerId,
        message: `New grouped order received! Total: ₹${group.total}`,
        type: 'new_order',
        relatedOrderId: order._id
      });
      await notif.save();
    }

    res.status(200).json({ success: true, message: 'Orders processed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error processing checkout' });
  }
};

module.exports = { ensureBuyer, renderMarketplace, renderDashboard, renderCart, renderCheckout, placeOrder, processCartCheckout };







