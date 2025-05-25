import { Request, Response, NextFunction } from 'express';
import Item, { IItem } from '../models/Item.model';
import mongoose from 'mongoose';

// Get all items for the authenticated user
export const getItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authorized, user ID missing' });
    }
    const items: IItem[] = await Item.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    next(error);
  }
};

// Create a new item for the authenticated user
export const createItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authorized, user ID missing' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    const newItem: IItem = new Item({
      name,
      description,
      user: req.user._id, // Associate item with the authenticated user
    });
    const savedItem = await newItem.save();

    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating item:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    next(error);
  }
};

// Get a single item by ID, ensuring it belongs to the authenticated user
export const getItemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authorized, user ID missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID format' });
    }

    const item: IItem | null = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Verify ownership
    if (item.user.toString() !== req.user._id.toString()) {
      // Return 404 to not reveal existence of item to unauthorized users
      return res.status(404).json({ message: 'Item not found (or not authorized)' });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching item by ID:', error);
    next(error);
  }
};

// Update an item by ID, ensuring it belongs to the authenticated user
export const updateItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authorized, user ID missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID format' });
    }

    const itemToUpdate: IItem | null = await Item.findById(id);

    if (!itemToUpdate) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Verify ownership
    if (itemToUpdate.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this item' });
    }

    // Update fields
    itemToUpdate.name = name || itemToUpdate.name;
    itemToUpdate.description = description === undefined ? itemToUpdate.description : description;
    // itemToUpdate.updatedAt = new Date(); // Handled by {timestamps: true}

    const updatedItem = await itemToUpdate.save();

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    next(error);
  }
};

// Delete an item by ID, ensuring it belongs to the authenticated user
export const deleteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authorized, user ID missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID format' });
    }

    const itemToDelete: IItem | null = await Item.findById(id);

    if (!itemToDelete) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Verify ownership
    if (itemToDelete.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this item' });
    }

    await itemToDelete.deleteOne(); // Mongoose 8+
    // For older versions: await Item.findByIdAndDelete(id);

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    next(error);
  }
};
