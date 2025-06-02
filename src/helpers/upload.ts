import multer, { FileFilterCallback, Multer } from "multer";
import { S3Client, PutObjectCommand, DeleteObjectCommand, S3ClientConfig } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Type definitions
interface S3UploadResult {
  url: string;
  key: string;
}

interface MulterFile extends Express.Multer.File {
  buffer?: Buffer;
  path?: string;
}

interface S3RequestWithFiles extends Request {
  files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
  file?: MulterFile; 
  body: {
    s3Files?: S3UploadResult[];
    [key: string]: any;
  };
}

interface DeleteImageResult {
  success: boolean;
  error?: any;
}

// AWS S3 Configuration
const s3Config: S3ClientConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "YOUR_ACCESS_KEY",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "YOUR_SECRET_KEY"
  }
};

const s3Client: S3Client = new S3Client(s3Config);

// S3 Bucket name and folder
const bucketName: string = process.env.AWS_S3_BUCKET_NAME || "your-bucket-name";
const folder: string = "uploads";

// Storage for direct uploads
const storage = multer.diskStorage({
  destination: function (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, '/tmp'); // Temporary storage before uploading to S3
  },
  filename: function (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix: string = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer configuration
const upload: Multer = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB limit
  },
});

// S3 Storage multer configuration (for memory uploads)
const uploadToMemory: Multer = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

/**
 * Function to upload file to S3 after multer processes it
 * @param file MulterFile - The file to upload
 * @param customFileName Optional custom filename for S3
 * @returns Promise resolving to S3UploadResult
 */
async function uploadFileToS3(file: MulterFile, customFileName?: string): Promise<S3UploadResult> {
  const fileName: string = customFileName || `${folder}/${Date.now()}-${file.originalname}`;
  
  const uploadParams = {
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer ? file.buffer : file.path ? fs.readFileSync(file.path) : Buffer.from([]),
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  try {
    // For larger files, use the Upload utility which handles multipart uploads
    const upload = new Upload({
      client: s3Client,
      params: uploadParams
    });

    const result = await upload.done();
    
    // Clean up local file if it was saved to disk
    if (file.path && !file.buffer) {
      fs.unlinkSync(file.path);
    }
    
    return {
      url: result.Location || `https://${bucketName}.s3.amazonaws.com/${fileName}`,
      key: fileName
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

/**
 * Extract the key from S3 URL
 * @param url The S3 URL
 * @returns The S3 object key or empty string if invalid
 */
function getS3Key(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove the leading slash
    return urlObj.pathname.substring(1);
  } catch (error) {
    console.error('Invalid S3 URL:', error);
    return '';
  }
}

/**
 * Delete image from S3
 * @param url The S3 URL of the image to delete
 * @returns Promise resolving to void
 */
async function deleteImage(url: string): Promise<void> {
  try {
    const key: string = getS3Key(url);
    if (!key) {
      return;
    }
    
    const deleteParams = {
      Bucket: bucketName,
      Key: key
    };
    
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log('Image deleted successfully from S3.');
  } catch (error: any) {
    console.error('Error deleting image from S3:', error.message);
  }
  return Promise.resolve();
}

/**
 * Handle multiple uploads middleware
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 */
const multipleUpload = (req: S3RequestWithFiles, res: Response, next: NextFunction): void => {
  const multerUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
  }).array('image', 5);
  
  multerUpload(req, res, async function(err) {
    if (err) {
      return next(err);
    }
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next();
    }
    
    try {
      const uploadPromises: Promise<S3UploadResult>[] = req.files.map((file: MulterFile) => 
        uploadFileToS3(file)
      );
      
      const results: S3UploadResult[] = await Promise.all(uploadPromises);
      
      // Add the S3 upload results back to the request
      req.body.s3Files = results;
      next();
    } catch (error) {
      next(error);
    }
  });
};

/**
 * Direct delete function (alternative implementation)
 * @param key The S3 object key to delete
 * @returns Promise resolving to DeleteImageResult
 */
async function handleDeleteImage(key: string): Promise<DeleteImageResult> {
  try {
    const deleteParams = {
      Bucket: bucketName,
      Key: key
    };
    
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log('Image deleted successfully.');
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error };
  }
}

export {
  upload,
  uploadFileToS3,
  deleteImage,
  multipleUpload,
  uploadToMemory,
  handleDeleteImage,
  s3Client,
  bucketName,
  // Export type definitions as well
  type S3UploadResult,
  type MulterFile,
  type S3RequestWithFiles,
  type DeleteImageResult
};