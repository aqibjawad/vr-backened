import mongoose, { Document, Schema } from 'mongoose';

export interface IArtist extends Document {
  name: string;
  profileImage: string;
  description: string;
  workImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ArtistSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  workImages: [{
    type: String
  }]
}, {
  timestamps: true
});

export default mongoose.model<IArtist>('Artist', ArtistSchema);
