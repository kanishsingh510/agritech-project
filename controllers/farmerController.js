const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Product = require('../models/product');

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

const createProduct = async (req, res, next) => {
  try {
    const { name, category, price, quantity, unit, description, isOrganic } = req.body;
    const product = new Product({
      name,
      category,
      price: Number(price),
      quantity: quantity,
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

    // Handle isOrganic checkbox
    if (updates.isOrganic) {
      updates.isOrganic = updates.isOrganic === 'on' || updates.isOrganic === true;
    } else {
      // If unchecked, it might be missing from body entirely
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

module.exports = { upload, ensureFarmer, renderDashboard, createProduct, updateProduct, deleteProduct };







