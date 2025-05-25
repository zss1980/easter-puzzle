import { Router } from 'express';
import {
  getItems,
  createItem,
  getItemById,
  updateItem,
  deleteItem,
} from '../controllers/itemController';
import { protect } from '../middleware/authMiddleware'; // Import the protect middleware

const router = Router();

// Public routes
router.get('/', getItems);
router.get('/:id', getItemById);

// Protected routes (require authentication)
router.post('/', protect, createItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

export default router;
