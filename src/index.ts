// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import db from './config/db.config';
import routes from './routes/routes';
import apiErrorHandler from './middlewares/apiErrorHandler';
import { ensureVPSStorageReady, getStorageInfo } from './helpers/vpsStorage';

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Create express app
const app = express();
const router = express.Router({ strict: true });

const corsOptions: cors.CorsOptions = {
  origin: '*', // Allow all origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow specific HTTP methods
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// API Port Here
const apiPort = process.env.PORT || 3000;
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from VPS storage directory
const storageInfo = getStorageInfo();
app.use('/storage', express.static(storageInfo.path));

// Keep uploads for backward compatibility (if needed)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use("/", router);
routes(app);

app.use(apiErrorHandler)

app.listen(apiPort, async () => {
  console.log(`Server running on port ${apiPort}`);
  
  // Initialize VPS storage on server start
  try {
    await ensureVPSStorageReady();
  } catch (error) {
    console.error('Failed to initialize VPS storage:', error);
  }
});
