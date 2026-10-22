import express from 'express';
import dotenv from 'dotenv';
import apiRouter from '../server/routes.ts';

dotenv.config();

const app = express();

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// All API routes
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Export as Vercel serverless handler
export default app;
