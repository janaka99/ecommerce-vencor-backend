import product from "../routes/product.routes.js";

const setupRoutes = (app) => {
  app.use("/api/v1/product", product);
};

export default setupRoutes;
