import AWS from 'aws-sdk';
import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Check if AWS credentials are available
const hasAWSCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

let s3: AWS.S3 | null = null;
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'vr-gallery-images';

if (hasAWSCredentials) {
  try {
    s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    console.log('AWS S3 configured successfully');
  } catch (error) {
    console.error('AWS S3 configuration failed:', error);
    s3 = null;
  }
} else {
  console.log('AWS credentials not found. Will use local storage as fallback.');
}

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Local storage configuration (fallback)
const localStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const folder = req.body.folder || 'artists';
    const folderPath = path.join(process.cwd(), 'uploads', folder);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    cb(null, folderPath);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${timestamp}-${name}${ext}`;
    cb(null, filename);
  }
});

// Export multer instance (will use local storage for now)
export const uploadToStorage = multer({
  storage: localStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Function to delete file (local storage)
export const deleteFromStorage = async (filePath: string): Promise<boolean> => {
  try {
    if (s3 && filePath.includes('amazonaws.com')) {
      // S3 deletion logic (if needed later)
      const urlParts = filePath.split('/');
      const key = urlParts.slice(-2).join('/');
      
      const params = {
        Bucket: bucketName,
        Key: key
      };

      await s3.deleteObject(params).promise();
      return true;
    } else {
      // Local file deletion
      const relativePath = filePath.replace(/^.*\/uploads\//, 'uploads/');
      const fullPath = path.join(process.cwd(), relativePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Function to get file URL
export const getStorageFileUrl = (req: Request, filename: string, folder: string = 'artists'): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

// Function to ensure storage is ready
export const ensureStorageReady = async (): Promise<void> => {
  if (s3) {
    try {
      await s3.headBucket({ Bucket: bucketName }).promise();
      console.log(`S3 bucket ${bucketName} is ready`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log(`S3 bucket ${bucketName} not found. You may need to create it manually.`);
      } else {
        console.error('Error checking S3 bucket:', error);
      }
    }
  } else {
    // Ensure local uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Local uploads directory created');
    }
  }
};
