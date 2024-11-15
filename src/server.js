import dotenv from "dotenv";
import { startServer } from "./server/expressServer.js";
import { config } from "./config/AppProperties.js";

dotenv.config();

startServer({
  port: parseInt(config.PORT),
});
