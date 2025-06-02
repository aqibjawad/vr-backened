import 'dotenv/config';
import express, { RequestHandler } from 'express';
import { uploadSingleFile } from './controller';
import { upload, uploadToMemory } from '../../helpers/upload';

const router = express.Router();

// Cast handlers to RequestHandler type using unknown as intermediate
const handlers = {
  uploadSingleFile: uploadSingleFile as unknown as RequestHandler
};


router.post("/upload-single-file", uploadToMemory.single("file"), handlers.uploadSingleFile)

export default router;
