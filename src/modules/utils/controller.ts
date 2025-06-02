import { Request, Response, NextFunction } from 'express';
import { InternalServerError } from '../../helpers/apiError';
import { s3Client, bucketName, uploadFileToS3 } from '../../helpers/upload';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

interface FileRequest extends Request {
  file?: Express.Multer.File & {
    buffer?: Buffer;
  };
}

export async function uploadSingleFile(req: FileRequest, res: Response) {
  try {
    // Check if file exists in the request
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ 
        status: "error", 
        message: 'No file uploaded or file buffer is missing' 
      });
    }

    const file = req.file;
    const publicId = `${Date.now()}-${req.file.originalname}`;
    const key = `uploads/${publicId}`;

    // Method 1: Using the uploadFileToS3 helper function
    try {
      const uploadResult = await uploadFileToS3(file, key);
      
      return res.status(200).json({
        status: "success",
        data: {
          image: uploadResult.url
        }
      });
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      return res.status(500).json({ 
        status: "error", 
        message: 'Error uploading image to S3' 
      });
    }

    // Alternative Method (direct S3 upload using PutObjectCommand)
    /*
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read' // Make the file publicly accessible
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      
      // Construct the URL directly (format: https://bucket-name.s3.amazonaws.com/key)
      const fileUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;
      
      return res.status(200).json({
        status: "success",
        data: {
          image: fileUrl
        }
      });
    } catch (error) {
      console.error('Error uploading to S3:', error);
      return res.status(500).json({ 
        status: "error", 
        message: 'Error uploading image to S3' 
      });
    }
    */
  } catch (error) {
    console.error('Error processing the image:', error);
    return res.status(500).json({ 
      status: "error", 
      message: 'Error processing the image' 
    });
  }
};