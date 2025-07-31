import { Request, Response } from 'express';
import Artist, { IArtist } from './artist.model';
import { deleteFromVPS, getVPSFileUrl } from '../../helpers/vpsStorage';

export class ArtistController {
  // Create a new artist
  static async createArtist(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          message: 'Artist name is required'
        });
        return;
      }

      // Get uploaded file URLs
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let profileImage = '';
      let workImages: string[] = [];

      if (files.profileImage && files.profileImage[0]) {
        profileImage = getVPSFileUrl(req, files.profileImage[0].filename, 'artists');
      }

      if (files.workImages) {
        workImages = files.workImages.map(file => getVPSFileUrl(req, file.filename, 'artists'));
      }

      const artist = new Artist({
        name: name.trim(),
        description: description || '',
        profileImage,
        workImages
      });

      const savedArtist = await artist.save();

      res.status(201).json({
        success: true,
        message: 'Artist created successfully',
        data: savedArtist
      });
    } catch (error) {
      console.error('Error creating artist:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all artists
  static async getAllArtists(req: Request, res: Response): Promise<void> {
    try {
      const artists = await Artist.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: 'Artists retrieved successfully',
        data: artists
      });
    } catch (error) {
      console.error('Error getting artists:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get artist by ID
  static async getArtistById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artist = await Artist.findById(id);

      if (!artist) {
        res.status(404).json({
          success: false,
          message: 'Artist not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Artist retrieved successfully',
        data: artist
      });
    } catch (error) {
      console.error('Error getting artist:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update artist
  static async updateArtist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const artist = await Artist.findById(id);
      if (!artist) {
        res.status(404).json({
          success: false,
          message: 'Artist not found'
        });
        return;
      }

      // Get uploaded file URLs from S3
      const files = req.files as { [fieldname: string]: Express.MulterS3.File[] };
      
      // Update basic info
      if (name && name.trim()) {
        artist.name = name.trim();
      }
      if (description !== undefined) {
        artist.description = description;
      }

      // Handle profile image update
      if (files.profileImage && files.profileImage[0]) {
        // Delete old profile image if exists
        if (artist.profileImage) {
          await deleteFromVPS(artist.profileImage);
        }
        artist.profileImage = getVPSFileUrl(req, files.profileImage[0].filename, 'artists');
      }

      // Handle work images update
      if (files.workImages) {
        // Delete old work images
        for (const imageUrl of artist.workImages) {
          await deleteFromVPS(imageUrl);
        }
        artist.workImages = files.workImages.map(file => getVPSFileUrl(req, file.filename, 'artists'));
      }

      const updatedArtist = await artist.save();

      res.status(200).json({
        success: true,
        message: 'Artist updated successfully',
        data: updatedArtist
      });
    } catch (error) {
      console.error('Error updating artist:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete artist
  static async deleteArtist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artist = await Artist.findById(id);

      if (!artist) {
        res.status(404).json({
          success: false,
          message: 'Artist not found'
        });
        return;
      }

      // Delete profile image from storage
      if (artist.profileImage) {
        await deleteFromVPS(artist.profileImage);
      }

      // Delete work images from VPS storage
      for (const imageUrl of artist.workImages) {
        await deleteFromVPS(imageUrl);
      }

      await Artist.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Artist deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting artist:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Add work images to existing artist
  static async addWorkImages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artist = await Artist.findById(id);

      if (!artist) {
        res.status(404).json({
          success: false,
          message: 'Artist not found'
        });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No images provided'
        });
        return;
      }

      const newImageUrls = files.map(file => getVPSFileUrl(req, file.filename, 'artists'));
      artist.workImages.push(...newImageUrls);

      const updatedArtist = await artist.save();

      res.status(200).json({
        success: true,
        message: 'Work images added successfully',
        data: updatedArtist
      });
    } catch (error) {
      console.error('Error adding work images:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Remove specific work image
  static async removeWorkImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        res.status(400).json({
          success: false,
          message: 'Image URL is required'
        });
        return;
      }

      const artist = await Artist.findById(id);
      if (!artist) {
        res.status(404).json({
          success: false,
          message: 'Artist not found'
        });
        return;
      }

      // Remove image URL from array
      artist.workImages = artist.workImages.filter(url => url !== imageUrl);
      
      // Delete image from VPS storage
      await deleteFromVPS(imageUrl);

      const updatedArtist = await artist.save();

      res.status(200).json({
        success: true,
        message: 'Work image removed successfully',
        data: updatedArtist
      });
    } catch (error) {
      console.error('Error removing work image:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
