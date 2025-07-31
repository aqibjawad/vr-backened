import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { Request } from 'express';
import path from 'path';

// Extend Express namespace to include MulterS3 file type
declare global {
  namespace Express {
    namespace MulterS3 {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        bucket: string;
        key: string;
        acl: string;
        contentType: string;
        contentDisposition: null;
        storageClass: string;
        serverSideEncryption: null;
        metadata: any;
        location: string;
        etag: string;
      }
    }
  }
}

// Configure AWS S3
let s3: AWS.S3;
try {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
} catch (error) {
  console.error('AWS S3 configuration error:', error);
  throw new Error('AWS S3 not configured properly. Please check your environment variables.');
}

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'vr-gallery-images';

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Check if AWS credentials are available
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('AWS credentials not found. S3 upload will not work. Please configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file.');
}

// Configure multer for S3 storage
const s3Storage = multerS3({
  s3: s3 as any,
  bucket: bucketName,
  acl: 'public-read', // Make files publicly readable
  key: function (req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) {
    const folder = req.body.folder || 'artists';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${folder}/${timestamp}-${name}${ext}`;
    cb(null, filename);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req: Request, file: Express.Multer.File, cb: (error: any, metadata?: any) => void) {
    cb(null, { fieldName: file.fieldname });
  }
});

// Export multer instance with S3 storage
export const uploadToS3 = multer({
  storage: s3Storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (increased from 5MB)
  }
});

// Function to delete file from S3
export const deleteFromS3 = async (fileUrl: string): Promise<boolean> => {
  try {
    // Extract key from S3 URL
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // Get folder/filename part
    
    const params = {
      Bucket: bucketName,
      Key: key
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

// Function to get S3 file URL (files are already public, so just return the location)
export const getS3FileUrl = (location: string): string => {
  return location;
};

// Function to check if S3 bucket exists and create if not
export const ensureS3Bucket = async (): Promise<void> => {
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`S3 bucket ${bucketName} exists`);
  } catch (error: any) {
    if (error.statusCode === 404) {
      try {
        await s3.createBucket({ Bucket: bucketName }).promise();
        console.log(`S3 bucket ${bucketName} created successfully`);
        
        // Set bucket policy for public read access
        const bucketPolicy = {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${bucketName}/*`
            }
          ]
        };

        await s3.putBucketPolicy({
          Bucket: bucketName,
          Policy: JSON.stringify(bucketPolicy)
        }).promise();
        
        console.log(`Public read policy applied to bucket ${bucketName}`);
      } catch (createError) {
        console.error('Error creating S3 bucket:', createError);
        throw createError;
      }
    } else {
      console.error('Error checking S3 bucket:', error);
      throw error;
    }
  }
};
