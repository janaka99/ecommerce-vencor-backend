import { config } from "../config/AppProperties.js";
import cors from "cors";

const allowedOrigins = config.CORS_ORIGINS;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin
    if (!origin) {
      return callback(null, true);
    }

    // check if the origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // check if the origin is a local host domain
    const localhostRegex = /^http:\/\/localhost(:\d+)?$/;
    if (localhostRegex.test(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"), false);
  },
  optionsSuccessStatus: 200,
  credentials: true,
};

const AppCors = () => {
  return cors(corsOptions);
};

export { AppCors };
