import { createApp } from "./app";
import { config } from "./config/env-config";
import { logger } from "./config/logger.config";

const startServer = async (): Promise<void> => {
  try {
    const app = createApp();

    const server = app.listen(config.port, config.host, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📱 Environment: ${config.env}`);
      logger.info(`🔗 Health check: http://${config.host}:${config.port}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
