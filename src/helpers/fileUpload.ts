import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'artists');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const folder = req.body.folder || 'artists';
    const folderPath = path.join(process.cwd(), 'uploads', folder);
    
    // Create folder if it doesn't exist
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

export const uploadToLocal = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Function to delete file from local storage
export const deleteFromLocal = async (filePath: string): Promise<boolean> => {
  try {
    // Extract relative path from URL
    const relativePath = filePath.replace(/^.*\/uploads\//, 'uploads/');
    const fullPath = path.join(process.cwd(), relativePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file from local storage:', error);
    return false;
  }
};

// Function to get file URL
export const getFileUrl = (req: Request, filename: string, folder: string = 'artists'): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${folder}/${filename}`;
};
