import { Application } from 'express';
import authRoutes from '../modules/authentication/user.routes';
import businessRoutes from '../modules/authBusiness/business.routes';
import categoryRoutes from '../modules/category/category.route';
import subCategoryRoute from '../modules/subcategory/subcategory.route';
import BusinessAuth from '../modules/authBusiness/business.routes';
import AddStaff from "../modules/staff/staff.routes"
import Admin from "../modules/admin/routes";
import Utils from "../modules/utils/routes";

import reviews from "../modules/reviews/review.route";

export default function router(app: Application): void {
  app.use('/api/user', authRoutes);
  app.use('/api/business', businessRoutes);
  app.use('/api/subcategory', subCategoryRoute);
  app.use('/api/category', categoryRoutes);
  app.use('/api/business-user', BusinessAuth);
  app.use('/api/staff', AddStaff);
  app.use('/api/admin', Admin);
  app.use('/api/utils', Utils);

  app.use('/api/reviews', reviews);
}
