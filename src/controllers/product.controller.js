import mongoose from "mongoose";
import {
  deleteImageFromCloud,
  uploadMultipleBuffers,
} from "../lib/multer/multer.js";
import {
  NewProductSchema,
  UpdateProductSchema,
} from "../schemas/product.schema.js";
import { Product } from "../models/product.model.js";

const createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { sku, name, qty, description, price, mainImageId } = req.body;
    const files = req.files;

    const parsedQty = parseInt(qty, 10);
    const parsedPrice = parseFloat(price);
    const parsedMainImageId = parseInt(mainImageId, 10);

    const validated = NewProductSchema.safeParse({
      sku,
      name,
      qty: parsedQty,
      description,
      price: parsedPrice,
      mainImageId: parsedMainImageId,
      images: files,
    });

    if (!validated.success) {
      return res.status(200).json({
        errors: validated.error,
      });
    }

    // Create the new product document
    const newProduct = new Product({
      sku,
      name,
      qty: parsedQty,
      description,
      price: parsedPrice,
    });

    const uploadRes = await uploadMultipleBuffers(files);

    for (let i = 0; i < uploadRes.length; i++) {
      // Push the uploaded image details to the product
      newProduct.images.push({
        imageId: uploadRes[i].public_id,
        url: uploadRes[i].secure_url,
        main: uploadRes[i].public_id === mainImageId,
      });
    }

    // Save the updated product with images
    await newProduct.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Product created successfully" });
  } catch (error) {
    if (error.code && error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const duplicateValue = error.keyValue[field];
      res.status(400).json({
        message: `Duplicate value detected: The ${field} '${duplicateValue}' already exists. Please use a unique value.`,
      });
    } else {
      res.status(500).json({ message: "An unexpected error occurred." });
    }
  }
};

const updateProductById = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      sku,
      name,
      qty,
      description,
      price,
      mainImageId,
      imageToBeDeleted,
    } = req.body;
    const files = req.files;

    const id = req.params.id;

    // FInd the product for update
    const product = await Product.findById(id);

    if (!product) {
      return res.status(400).json({ error: "Something Went Wrong" });
    }

    const parsedQty = parseInt(qty, 10);
    const parsedPrice = parseFloat(price);
    const parsedMainImageId = parseInt(mainImageId, 10);
    const imageToBeDeletedArray = JSON.parse(imageToBeDeleted);

    const validated = UpdateProductSchema.safeParse({
      sku,
      name,
      qty: parsedQty,
      description,
      price: parsedPrice,
      newImages: files,
      imagesToBeDeleted: imageToBeDeletedArray,
      mainImageId: parsedMainImageId,
    });

    if (!validated.success) {
      return res.status(200).json({
        errors: validated.error,
      });
    }

    let uploadRes = null;
    let restOftheImages = [];
    let deletedImages = [];

    // If images  to be delete - remove them from array and cloud
    if (imageToBeDeletedArray.length > 0) {
      for (let imgId of imageToBeDeletedArray) {
        deletedImages = product.images.filter((i) => imgId == i._id);
        restOftheImages = product.images.filter((i) => imgId != i._id);
      }

      for (let dm of deletedImages) {
        await deleteImageFromCloud(dm.imageId);
      }
    } else {
      restOftheImages = product.images;
    }

    // Maximum 5 images are allowed
    if (restOftheImages.length + files.length > 5) {
      return res.status(400).json({ error: "Maximum 5 images are allowed!" });
    }

    if (files) {
      uploadRes = await uploadMultipleBuffers(files);
      for (let i = 0; i < uploadRes.length; i++) {
        restOftheImages.push({
          imageId: uploadRes[i].public_id,
          url: uploadRes[i].secure_url,
          main: uploadRes[i].public_id === mainImageId,
        });
      }
    }

    product.sku = validated.data.sku;
    product.name = validated.data.name;
    product.qty = parsedQty;
    product.price = parsedPrice;
    product.description = validated.data.description;
    product.sku = validated.data.sku;
    product.images = restOftheImages;

    // Update the Main Image
    if (parsedMainImageId && parsedMainImageId < 5) {
      for (let pr of product.images) {
        pr.main = false;
      }
      if (parsedMainImageId > restOftheImages.length - 1) {
        product.images[0].main = true;
      } else {
        product.images[parsedMainImageId].main = true;
      }
    }

    // Save the updated product with images
    await product.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Product updated successfully" });
  } catch (error) {
    if (error.code && error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const duplicateValue = error.keyValue[field];
      return res.status(400).json({
        message: `Duplicate value detected: The ${field} '${duplicateValue}' already exists. Please use a unique value.`,
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await Product.findById(id);

    if (product) {
      return res.status(200).json({ product });
    }
    return res.status(401).json({ error: "Could not find the product" });
  } catch (error) {
    return res.status(401).json({ error: "Something Went Wrong" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();

    if (products) {
      return res.status(200).json({ products });
    }
    return res.status(401).json({ error: "Could not find any products" });
  } catch (error) {
    return res.status(401).json({ error: "Something Went Wrong" });
  }
};

const getFavouriteProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isFavorite: true,
    });

    if (products) {
      return res.status(200).json({ products });
    }
    return res.status(401).json({ error: "Could not find any products" });
  } catch (error) {
    return res.status(401).json({ error: "Something Went Wrong" });
  }
};

const deleteProductById = async (req, res) => {
  try {
    const id = req.params.id;

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (deletedProduct) {
      for (var dp of deletedProduct.images) {
        await deleteImageFromCloud(dp.imageId);
      }

      return res.status(200).json({ success: "Successfully Deleted" });
    }
    return res.status(401).json({ error: "Could not find the product" });
  } catch (error) {
    return res.status(401).json({ error: "Something Went Wrong" });
  }
};

const searchByQuery = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery) {
      const products = await Product.find();
      return res.status(200).json({ products: products });
    }

    const words = searchQuery.trim().split(/\s+/);

    const regexPattern = words.map((word) => new RegExp(word, "i"));

    const matchingProducts = await Product.find({
      $or: [
        { name: { $in: regexPattern } },
        { description: { $in: regexPattern } },
      ],
    });
    if (matchingProducts.length > 0) {
      return res.status(200).json({ products: matchingProducts });
    } else {
      return res
        .status(404)
        .json({ message: "No products found matching the search query" });
    }
  } catch (error) {
    console.error("Error searching for products:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while searching for products" });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { id: productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Toggle the isFavorite field
    product.isFavorite = !product.isFavorite;

    // Save the updated product
    await product.save();

    return res.status(200).json({
      message: "Product favorite status updated successfully",
      product: product,
    });
  } catch (error) {
    console.error("Error updating favorite status:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while updating the favorite status" });
  }
};

export {
  createProduct,
  getProductById,
  getAllProducts,
  deleteProductById,
  searchByQuery,
  toggleFavorite,
  updateProductById,
  getFavouriteProducts,
};
