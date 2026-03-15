const mongoose = require('mongoose');

const connectDB = async () => {
  const localURI = 'mongodb://127.0.0.1:27017/agritech';
  const atlasURI = process.env.ATLAS_URI || 'mongodb+srv://jahanvi:agritech2025@cluster0.ersuawn.mongodb.net/agritech?retryWrites=true&w=majority&appName=Cluster0';

  try {
    await mongoose.connect(localURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000
    });
    console.log('✅ MongoDB Connected (Local)');
  } catch (err) {
    console.warn('⚠️ Local MongoDB not running, switching to Atlas...');
    if (!atlasURI || atlasURI.trim() === '') {
      console.error('❌ ATLAS_URI is not set. Please set ATLAS_URI in your .env file.');
      process.exit(1);
    }
    try {
      await mongoose.connect(atlasURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000
      });
      console.log('✅ MongoDB Connected (Atlas Cloud)');
    } catch (error) {
      console.error('❌ Atlas connection failed:', error.message);
      console.error('Please check your ATLAS_URI and network connection.');
      process.exit(1);
    }
  }
};
module.exports = connectDB;


