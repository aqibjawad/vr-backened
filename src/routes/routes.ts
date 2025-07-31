import { Application } from 'express';
import authRoutes from '../modules/authentication/user.routes';
import artistRoutes from '../modules/artist/artist.routes';

export default function router(app: Application): void {
  app.use('/api/user', authRoutes);
  app.use('/api/artist', artistRoutes);
}
