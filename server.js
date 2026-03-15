const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

let PORT = process.env.PORT || 4001;

async function bootstrap() {
  await connectDB();

  // ✅ Session initialized after DB connect
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'agri-tech-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 24 },
      store: MongoStore.create({
        client: mongoose.connection.getClient(),
        collectionName: 'sessions'
      })
    })
  );

  // ✅ Locals middleware (after session)
  app.use((req, res, next) => {
    res.locals.currentUser = req.session?.user || null;
    res.locals.role = req.session?.user?.role || null;
    next();
  });

  // Home route
  app.get('/', (req, res) => {
    res.render('home');
  });

  // Routes
  const authRoutes = require('./routes/auth');
  const farmerRoutes = require('./routes/farmer');
  const buyerRoutes = require('./routes/buyer');
  const paymentRoutes = require('./routes/payment');
  const productRoutes = require('./routes/product');

  app.use('/', authRoutes);
  app.use('/farmer', farmerRoutes);
  app.use('/buyer', buyerRoutes);
  app.use('/payment', paymentRoutes);
  app.use('/products', productRoutes);

  // Error handling
  app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(err.status || 500).send('Something went wrong. Please try again.');
  });

  // 🧠 Auto-Free Port Logic
  const startServer = (port) => {
    const server = app.listen(port, () => {
      console.log(`✅ MongoDB Connected (Local)`);
      console.log(`🚀 Server running on http://localhost:${port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} is busy, trying next port...`);
        startServer(port + 1);
      } else {
        console.error('Server listen error:', err.message);
        process.exit(1);
      }
    });
  };

  // Start server with auto port selection
  startServer(PORT);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
