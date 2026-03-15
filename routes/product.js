const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const categories = ['fruits', 'vegetables', 'dairy', 'grains', 'spices', 'organic'];

// Configure multer for file uploads
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

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && category !== 'All' && category !== 'all') {
      filter.category = category.toLowerCase();
    }
    const products = await Product.find(filter).sort({ createdAt: -1 }).populate('farmerId', 'name location');
    res.render('products/index', { products, category: category || 'All', categories });
  } catch (err) { next(err); }
});

router.get('/new', (req, res) => {
  res.render('products/new', { categories });
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('farmerId', 'name location');
    if (!product) return res.status(404).send('Product not found');
    res.render('products/show', { product });
  } catch (err) { next(err); }
});

router.get('/:id/edit', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found');
    res.render('products/edit', { product, categories });
  } catch (err) { next(err); }
});

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const productData = { ...req.body };
    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    }
    if (productData.price) productData.price = Number(productData.price);
    if (productData.isOrganic) productData.isOrganic = productData.isOrganic === 'on' || productData.isOrganic === true;
    const newProduct = new Product(productData);
    await newProduct.save();
    res.redirect('/products');
  } catch (err) { next(err); }
});

router.post('/:id', upload.single('image'), async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      // Delete old image if exists
      const existing = await Product.findById(req.params.id);
      if (existing && existing.image) {
        const oldPath = path.join(__dirname, '..', 'public', existing.image.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, () => {});
        }
      }
      updates.image = `/uploads/${req.file.filename}`;
    }
    if (updates.price) updates.price = Number(updates.price);
    if (updates.isOrganic) updates.isOrganic = updates.isOrganic === 'on' || updates.isOrganic === true;
    await Product.findByIdAndUpdate(req.params.id, updates, { runValidators: true, new: true });
    res.redirect('/products');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/products');
  } catch (err) { next(err); }
});

module.exports = router;




