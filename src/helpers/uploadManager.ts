import { Request } from 'express';

// Check if AWS credentials are available
const hasAWSCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

// Export the appropriate upload handler based on available credentials
if (hasAWSCredentials) {
  console.log('AWS credentials found. Using S3 storage.');
  try {
    const s3Upload = require('./s3Upload');
    module.exports = {
      uploadToStorage: s3Upload.uploadToS3,
      deleteFromStorage: s3Upload.deleteFromS3,
      getStorageFileUrl: s3Upload.getS3FileUrl
    };
  } catch (error) {
    console.error('Failed to load S3 upload module:', error);
    console.log('Falling back to local storage.');
    const localUpload = require('./fileUpload');
    module.exports = {
      uploadToStorage: localUpload.uploadToLocal,
      deleteFromStorage: localUpload.deleteFromLocal,
      getStorageFileUrl: localUpload.getFileUrl
    };
  }
} else {
  console.log('AWS credentials not found. Using local storage.');
  const localUpload = require('./fileUpload');
  module.exports = {
    uploadToStorage: localUpload.uploadToLocal,
    deleteFromStorage: localUpload.deleteFromLocal,
    getStorageFileUrl: localUpload.getFileUrl
  };
}
