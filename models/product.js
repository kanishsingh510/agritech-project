const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      lowercase: true,
      enum: ["fruits", "vegetables", "dairy", "grains", "spices", "organic"]
    },
    quantity: {
      type: String,
      required: true,
      default: "1 kg"
    },
    unit: {
      type: String,
      enum: ["kg", "litre", "dozen", "piece"],
      default: "kg"
    },
    description: {
      type: String,
      required: true,
      maxlength: 200
    },
    image: {
      type: String,
      default: null
    },
    imagePath: {
      type: String,
      default: null
    },
    isOrganic: {
      type: Boolean,
      default: false
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
