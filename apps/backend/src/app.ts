import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { config } from '@/config/env-config';
import { routes } from '@/modules/index';
import { errorMiddleware } from '@/middlewares/error-middleware';

export const createApp = (): express.Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
    })
  );

  // Logging middleware
  app.use(morgan('combined'));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Compression middleware
  app.use(compression());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
  });

  // API routes
  app.use('/api', routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
    });
  });

  // Global error handler
  app.use(errorMiddleware);

  return app;
};

export default createApp;
