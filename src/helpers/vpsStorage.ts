import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Configure storage path - save outside backend folder for better performance
// You can change this path to any location on your VPS
const VPS_STORAGE_PATH = process.env.VPS_STORAGE_PATH || path.join(process.cwd(), '..', 'vr-gallery-storage');

// Create storage directory if it doesn't exist
const ensureStorageDirectory = (folderPath: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Created storage directory: ${folderPath}`);
  }
};

// Initialize main storage directory
ensureStorageDirectory(VPS_STORAGE_PATH);
ensureStorageDirectory(path.join(VPS_STORAGE_PATH, 'artists'));

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer for VPS storage
const vpsStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const folder = req.body.folder || 'artists';
    const folderPath = path.join(VPS_STORAGE_PATH, folder);
    
    // Create folder if it doesn't exist
    ensureStorageDirectory(folderPath);
    
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

// Export multer instance with VPS storage
export const uploadToVPS = multer({
  storage: vpsStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Function to delete file from VPS storage
export const deleteFromVPS = async (filePath: string): Promise<boolean> => {
  try {
    // Extract relative path from URL
    const relativePath = filePath.replace(/^.*\/storage\//, '');
    const fullPath = path.join(VPS_STORAGE_PATH, relativePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted file: ${fullPath}`);
      return true;
    }
    console.log(`File not found: ${fullPath}`);
    return false;
  } catch (error) {
    console.error('Error deleting file from VPS storage:', error);
    return false;
  }
};

// Function to get VPS file URL
export const getVPSFileUrl = (req: Request, filename: string, folder: string = 'artists'): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/storage/${folder}/${filename}`;
};

// Function to get storage info
export const getStorageInfo = (): { path: string; exists: boolean } => {
  return {
    path: VPS_STORAGE_PATH,
    exists: fs.existsSync(VPS_STORAGE_PATH)
  };
};

// Function to ensure VPS storage is ready
export const ensureVPSStorageReady = async (): Promise<void> => {
  try {
    ensureStorageDirectory(VPS_STORAGE_PATH);
    ensureStorageDirectory(path.join(VPS_STORAGE_PATH, 'artists'));
    
    const storageInfo = getStorageInfo();
    console.log(`VPS Storage initialized at: ${storageInfo.path}`);
    console.log(`Storage directory exists: ${storageInfo.exists}`);
  } catch (error) {
    console.error('Error initializing VPS storage:', error);
    throw error;
  }
};
