import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database'; // Import the connectDB function
import itemRoutes from './routes/itemRoutes';
import healthRoutes from './routes/healthRoutes';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

const app: Application = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/items', itemRoutes);
app.use('/api/health', healthRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running!');
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`Error: ${err.message}`);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({ message: 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      mongoose.connection.close().then(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      }).catch(err => {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      });
    });
  });
}

export default app;
