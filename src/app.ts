import { tfReady } from "./deps.ts";
import logger from "./pino-logger.ts";
import { loadModel } from "./model.ts";
import { processStream } from "./stream-processor.ts";
import { loadConfig } from "./config.ts";

// Main application function
async function main() {
  // Load configuration
  const config = await loadConfig();
 
  if (!config.rtsp.url) {
    logger.fatal("🚫 RTSP stream URL is not defined in configuration");
    Deno.exit(1);
  }

  // Ensure TensorFlow is ready
  await tfReady();
  logger.info("✅ TensorFlow.js is ready");

  // Configuration for the YAMNet model
  const modelConfig = {
    modelUrl: config.model.path,
    labels: (await import("./yamnet-labels.ts")).getYAMNetLabels(),
    sampleRate: config.audio.sampleRate,
    frameDuration: config.audio.frameDuration,
  };

  // Ensure logs directory exists
  try {
    await Deno.mkdir("logs", { recursive: true });
    logger.info("📁 Logs directory ready");
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      logger.fatal({ error }, "💥 Failed to create logs directory");
      Deno.exit(1);
    }
  }

  // Load model and process stream
  try {
    logger.info("🔍 Loading YAMNet model...");
    const model = await loadModel(modelConfig);
    logger.info("✅ Model loaded successfully");
   
    await processStream(model, config.rtsp.url, modelConfig, logger);
  } catch (error) {
    logger.fatal({ error }, "🔥 Fatal error");
    Deno.exit(1);
  }
}

// Handle uncaught errors
globalThis.addEventListener("unhandledrejection", (event) => {
  logger.fatal({ reason: event.reason }, "💥 Unhandled Rejection");
  Deno.exit(1);
});

globalThis.addEventListener("error", (event) => {
  logger.fatal({ error: event.error }, "💥 Uncaught Exception");
  Deno.exit(1);
});

// Start the application
await main();