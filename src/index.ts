import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { authMiddleware, devAuthMiddleware } from './middlewares/authMiddleware';
import budgetRoutes from './routes/budgetRoutes';
import expenseRoutes from './routes/expenseRoutes';
import categoryRoutes from './routes/categoryRoutes';
import { testConnection } from './config/db';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: Number(process.env.RATE_LIMIT_MAX) || 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS handling
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Logging
app.use(limiter); // Rate limiting

// Test database connection
testConnection().catch(console.error);

// Authentication middleware
// In development, you can use devAuthMiddleware instead for testing
const authMiddlewareToUse =
  process.env.NODE_ENV === 'development' ? devAuthMiddleware : authMiddleware;

// Routes
app.use('/api/budgets', authMiddlewareToUse, budgetRoutes);
app.use('/api/expenses', authMiddlewareToUse, expenseRoutes);
app.use('/api/categories', authMiddlewareToUse, categoryRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
