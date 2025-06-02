// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import db from './config/db.config';
import routes from './routes/routes';
import apiErrorHandler from './middlewares/apiErrorHandler';
// Add this import (adjust the path according to where your ApiError is defined)
import ApiError from './helpers/apiError';

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Create express app
const app = express();

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


routes(app);

// Remove both these blocks
// app.use(apiErrorHandler)
// app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
//     return apiErrorHandler(err, req, res, next);
// });

// Add this instead
app.use((err: ApiError | Error, req: Request, res: Response, next: NextFunction) => {
    apiErrorHandler(err as ApiError, req, res, next);
});

app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`));
