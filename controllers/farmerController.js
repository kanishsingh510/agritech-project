const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Product = require('../models/product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({ storage });

const ensureFarmer = (req, res, next) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'farmer') {
    return res.redirect('/login');
  }
  // Make sure user data is available in the request
  req.user = req.session.user;
  res.locals.user = req.session.user; // Make user available in all views
  next();
};

const mongoose = require('mongoose');

const renderDashboard = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user || !req.session.user._id) {
      return res.redirect('/login');
    }

    const { category, success, updated, deleted, error } = req.query;
    // Build query based on category
    let query = { farmerId: req.session.user._id };
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.render('farmer/dashboard', {
      user: req.session.user,
      products,
      category: category || null,
      success: success === '1',
      updated: updated === '1',
      deleted: deleted === '1',
      error: error || null
    });
  } catch (err) {
    console.error(err);
    // Temporary debug for the user
    return res.status(500).send('<pre>' + (err.stack || err.message || err) + '</pre>');
  }
};

const getProductDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid Product ID');
    }

    const product = await Product.findOne({ _id: id, farmerId: req.session.user._id });
    if (!product) {
      return res.status(404).send('Product not found or you do not have permission to view it.');
    }

    res.render('farmer/productDetails', { 
      user: req.session.user, 
      product 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('<pre>' + (err.stack || err.message || err) + '</pre>');
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, category, price, stock, lowStockThreshold, unit, description, isOrganic } = req.body;
    const product = new Product({
      name,
      category,
      price: Number(price),
      stock: Number(stock) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      unit,
      description,
      isOrganic: isOrganic === 'on' || isOrganic === true,
      farmerId: req.session.user._id
    });
    if (req.file) {
      product.image = `/uploads/${req.file.filename}`;
      product.imagePath = product.image;
    }
    await product.save();
    res.redirect('/farmer/dashboard?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('<pre>' + (err.stack || err.message || err) + '</pre>');
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid Product ID');
    }

    const updates = { ...req.body };
    if (updates.price) updates.price = Number(updates.price);
    if (updates.stock) updates.stock = Number(updates.stock);
    if (updates.lowStockThreshold) updates.lowStockThreshold = Number(updates.lowStockThreshold);
    
    // Explicitly prevent clearing the image if no new file is provided
    delete updates.image;
    delete updates.imagePath;

    // Handle isOrganic checkbox
    if (updates.isOrganic) {
      updates.isOrganic = updates.isOrganic === 'on' || updates.isOrganic === true;
    } else {
      updates.isOrganic = false;
    }

    if (req.file) {
      // delete old image if exists
      const existing = await Product.findOne({ _id: id, farmerId: req.session.user._id });
      if (existing && existing.image) {
        try {
          const oldPath = path.join(__dirname, '..', 'public', existing.image.replace(/^\//, ''));
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (e) { console.error('Error deleting image:', e); }
      }
      updates.image = `/uploads/${req.file.filename}`;
      updates.imagePath = updates.image;
    }

    await Product.findOneAndUpdate({ _id: id, farmerId: req.session.user._id }, updates, { new: true, runValidators: true });
    res.redirect('/farmer/dashboard?updated=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('<pre>' + (err.stack || err.message || err) + '</pre>');
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid Product ID');
    }

    const existing = await Product.findOneAndDelete({ _id: id, farmerId: req.session.user._id });
    if (existing && existing.image) {
      try {
        const filePath = path.join(__dirname, '..', 'public', existing.image.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) { console.error('Error deleting image:', e); }
    }
    res.redirect('/farmer/dashboard?deleted=1');
  } catch (err) {
    console.error(err);
    return res.status(500).send('<pre>' + (err.stack || err.message || err) + '</pre>');
  }
};

const renderOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ farmerId: req.session.user._id })
      .populate('items.productId')
      .sort({ createdAt: -1 });
    res.render('farmer/orders', { user: req.session.user, orders });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await Order.findOne({ _id: id, farmerId: req.session.user._id });
    if (!order) return res.status(404).send('Order not found');

    if (status === 'accepted' && order.status === 'pending') {
      // Loop over items safely to ensure sufficient bounds natively before decrementing.
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (!product || product.stock < item.quantity) {
          return res.status(400).send(`Cannot accept order: Product stock is insufficient for ${product ? product.name : 'Unknown item'}.`);
        }
      }
      // If securely viable, atomically iterate
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    order.status = status;
    await order.save();

    res.redirect('/farmer/orders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating order');
  }
};

const renderAnalytics = async (req, res, next) => {
  try {
    res.render('farmer/analytics', { user: req.session.user });
  } catch (err) {
    next(err);
  }
};

const getAnalyticsData = async (req, res, next) => {
  try {
    const farmerIdStr = req.session.user._id.toString();
    const farmerObjectId = new mongoose.Types.ObjectId(farmerIdStr);

    // pending orders
    const pendingCount = await Order.countDocuments({ farmerId: farmerIdStr, status: 'pending' });
    
    // delivered orders stats
    const deliveredOrders = await Order.find({ farmerId: farmerIdStr, status: 'delivered' });
    
    let totalRevenue = 0;
    let productsSold = 0;
    
    // Aggregate product sales
    const productStats = await Order.aggregate([
      { $match: { farmerId: farmerObjectId, status: 'delivered' } },
      { $unwind: "$items" },
      { $group: {
          _id: "$items.productId",
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
      }},
      { $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
      }},
      { $unwind: "$product" },
      { $project: {
          name: "$product.name",
          category: "$product.category",
          quantitySold: 1,
          revenue: 1
      }},
      { $sort: { quantitySold: -1 } }
    ]);

    const categorySalesMap = {};
    productStats.forEach(stat => {
      productsSold += stat.quantitySold;
      const cat = stat.category || 'Uncategorized';
      if (!categorySalesMap[cat]) categorySalesMap[cat] = 0;
      categorySalesMap[cat] += stat.quantitySold;
    });

    const salesTrendRaw = await Order.aggregate([
      { $match: { farmerId: farmerObjectId, status: 'delivered' } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    const salesTrend = salesTrendRaw.map(t => {
      totalRevenue += t.revenue;
      return { date: t._id, revenue: t.revenue };
    });

    // Recent 5 delivered orders
    const recentDelivered = await Order.find({ farmerId: farmerObjectId, status: 'delivered' })
      .populate('items.productId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      summary: {
        totalRevenue,
        deliveredCount: deliveredOrders.length,
        productsSold,
        pendingCount
      },
      productStats,
      categoryStats: Object.entries(categorySalesMap).map(([cat, qty]) => ({ category: cat, quantity: qty })),
      salesTrend,
      recentDelivered
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = { upload, ensureFarmer, renderDashboard, getProductDetails, createProduct, updateProduct, deleteProduct, renderOrders, updateOrderStatus, renderAnalytics, getAnalyticsData };







