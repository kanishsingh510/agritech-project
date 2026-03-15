const bcrypt = require('bcrypt');
const User = require('../models/User');
const Product = require('../models/product');

const renderLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'farmer' ? '/farmer/dashboard' : '/buyer/marketplace');
  }
  res.render('login');
};

const renderSignup = (req, res) => {
  res.render('signup');
};

// Validation middleware for signup
const validateSignup = (req, res, next) => {
  const { name, email, password, confirmPassword, role } = req.body;
  const errors = [];

  // Name validation
  if (!name || !/^[A-Za-z\s]{3,}$/.test(name)) {
    errors.push('Name must contain only letters and be at least 3 characters long');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    errors.push('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
  }

  // Confirm password
  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  // Role validation
  if (!role || !['farmer', 'buyer'].includes(role)) {
    errors.push('Please select a valid role');
  }

  if (errors.length > 0) {
    return res.status(400).render('signup', { 
      error: errors[0],
      formData: req.body
    });
  }

  next();
};

// Check if email exists API endpoint
const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existingUser = await User.findOne({ email });
    res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Error checking email' });
  }
};

// Signup controller
const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, location } = req.body;
    
    // Check if user already exists (double-check)
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).render('signup', { 
        error: 'This email is already registered',
        formData: req.body
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      passwordHash, 
      role, 
      location: location ? location.trim() : '' 
    });

    // Set session
    req.session.user = { 
      _id: user._id, 
      name: user.name, 
      role: user.role 
    };

    // Redirect based on role
    return res.redirect(user.role === 'farmer' ? '/farmer/dashboard' : '/buyer/marketplace');
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).render('signup', { 
      error: 'An error occurred during signup. Please try again.',
      formData: req.body
    });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });
    if (!user) return res.status(400).send('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).send('Invalid credentials');
    req.session.user = { _id: user._id, name: user.name, role: user.role };
    return res.redirect(user.role === 'farmer' ? '/farmer/dashboard' : '/buyer/marketplace');
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

// Demo seed
const seedDemo = async (req, res, next) => {
  try {
    const farmerEmail = 'farmer@gmail.com';
    const buyerEmail = 'buyer@gmail.com';
    const existingFarmer = await User.findOne({ email: farmerEmail });
    const existingBuyer = await User.findOne({ email: buyerEmail });
    let farmer = existingFarmer;
    let buyer = existingBuyer;
    if (!farmer) {
      farmer = await User.create({ name: 'Demo Farmer', email: farmerEmail, passwordHash: await bcrypt.hash('123456', 10), role: 'farmer', location: 'Nashik' });
    }
    if (!buyer) {
      buyer = await User.create({ name: 'Demo Buyer', email: buyerEmail, passwordHash: await bcrypt.hash('123456', 10), role: 'buyer', location: 'Mumbai' });
    }
    const existingProducts = await Product.countDocuments({});
    if (existingProducts === 0) {
      const demo = [
        { name: 'Mango', category: 'fruits', price: 120, quantity: '1 kg', description: 'Sweet and juicy', farmerId: farmer._id },
        { name: 'Onion', category: 'vegetables', price: 35, quantity: '1 kg', description: 'Fresh onions', farmerId: farmer._id },
        { name: 'Rice', category: 'grains', price: 90, quantity: '1 kg', description: 'Premium basmati', farmerId: farmer._id },
        { name: 'Milk', category: 'dairy', price: 70, quantity: '1 litre', description: 'Organic cow milk', farmerId: farmer._id },
        { name: 'Ghee', category: 'dairy', price: 600, quantity: '1 kg', description: 'Pure desi ghee', farmerId: farmer._id },
        { name: 'Wheat', category: 'grains', price: 45, quantity: '1 kg', description: 'Stone-ground flour', farmerId: farmer._id },
        { name: 'Tomato', category: 'vegetables', price: 40, quantity: '1 kg', description: 'Red and fresh', farmerId: farmer._id }
      ];
      await Product.insertMany(demo);
    }
    res.send('Seeded demo users and products. Farmer: farmer@gmail.com/123456, Buyer: buyer@gmail.com/123456');
  } catch (err) { next(err); }
};

module.exports = { 
  renderLogin, 
  renderSignup, 
  signup, 
  login, 
  logout, 
  seedDemo, 
  validateSignup, 
  checkEmailExists 
};


