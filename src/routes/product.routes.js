import express from "express";
import {
  createProduct,
  getProductById,
  getAllProducts,
  deleteProductById,
  searchByQuery,
  toggleFavorite,
  updateProductById,
  getFavouriteProducts,
} from "../controllers/product.controller.js";
import { upload } from "../lib/multer/multer.js";

const router = express.Router();

// GET - get all products
router.route("/").get(getAllProducts);

// POST - add new product
router.route("/create").post(upload.array("images[]", 5), createProduct);

// GET -  Search product by term
router.route("/search").get(searchByQuery);

// GET -  Search product by term
router.route("/favourite").get(getFavouriteProducts);

router.route("/favourite/:id").post(toggleFavorite);

router
  .route("/by/:id")
  .get(getProductById)
  .delete(deleteProductById)
  .put(upload.array("newImages[]", 5), updateProductById);

export default router;
