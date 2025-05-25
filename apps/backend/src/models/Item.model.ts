import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  name: string;
  description?: string;
  user: mongoose.Types.ObjectId; // Reference to the User who owns the item
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema<IItem> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [3, 'Item name must be at least 3 characters long'],
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Links this item to a User document
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Indexing for fields that will be frequently queried
ItemSchema.index({ name: 1 });
ItemSchema.index({ user: 1 }); // Index for querying items by user

const Item = mongoose.model<IItem>('Item', ItemSchema);

export default Item;
