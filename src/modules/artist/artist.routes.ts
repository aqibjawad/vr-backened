import { Router } from 'express';
import { ArtistController } from './artist.controller';
import { uploadToVPS } from '../../helpers/vpsStorage';

const router = Router();

// Configure multer fields for different upload scenarios
const uploadFields = uploadToVPS.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'workImages', maxCount: 10 }
]);

const uploadWorkImages = uploadToVPS.array('workImages', 10);

// Routes
router.post('/create', uploadFields, ArtistController.createArtist);
router.get('/all', ArtistController.getAllArtists);
router.get('/:id', ArtistController.getArtistById);
router.put('/:id', uploadFields, ArtistController.updateArtist);
router.delete('/:id', ArtistController.deleteArtist);
router.post('/:id/add-work-images', uploadWorkImages, ArtistController.addWorkImages);
router.delete('/:id/remove-work-image', ArtistController.removeWorkImage);

export default router;
