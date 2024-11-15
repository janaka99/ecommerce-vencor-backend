import mongoose from "mongoose";

const ProductImageSchema = new mongoose.Schema({
  imageId: {
    type: String,
    required: true,
    unique: true,
  },
  url: {
    type: String,
    required: true,
  },
  main: {
    type: Boolean,
    default: false,
  },
});

const ProductSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  images: {
    type: [ProductImageSchema],
    validate: {
      validator: function (images) {
        const mainImages = images.filter((img) => img.main);
        return mainImages.length <= 1;
      },
      message: "Only one image can be marked as the main image.",
    },
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
});

const Product = mongoose.model("Product", ProductSchema);

export { Product };
