import { connectDB } from "../config/db.js";
import setupRoutes from "./routes.js";
import { AppCors } from "./security.js";
import express from "express";

export const startServer = async ({ port }) => {
  const app = express();

  app.use(AppCors(), express.urlencoded({ extended: true }), express.json());

  await connectDB();

  // TODO - ADD Helmet for secure connection

  // setup modules
  setupRoutes(app);

  app.listen(port, () => console.log(`Server running on port ${port}`));
};
