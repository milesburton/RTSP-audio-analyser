import { tfReady } from "./deps.ts";
import logger from "./pino-logger.ts";
import { loadModel } from "./model.ts";
import { processStream } from "./stream-processor.ts";
import { loadConfig } from "./config.ts";
import { logStartup, logError } from "./boxen-logger.ts";

// Main application function
async function main() {
  // Load configuration
  const config = await loadConfig();

  // Log startup information in a box
  logStartup(
    "Audio Event Detector",
    "1.0.0",
    "A clever audio detection system using TensorFlow.js and YAMNet"
  );

  if (!config.rtsp.url) {
    logError(
      "RTSP stream URL is not defined in configuration.\nPlease set RTSP_STREAM in your .env file.",
      "CONFIGURATION ERROR"
    );
    Deno.exit(1);
  }
  // Ensure TensorFlow is ready
  try {
    await tfReady();
    logger.info("✅ TensorFlow.js is ready");
  } catch (error) {
    logError(
      "Failed to initialize TensorFlow.js.\nPlease check your installation.",
      "TENSORFLOW ERROR"
    );
    logger.debug({ error }, "🔍 Detailed TensorFlow initialization error");
    Deno.exit(1);
  }

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
    logError(
      `Fatal application error:\n${
        error instanceof Error ? error.message : String(error)
      }`,
      "APPLICATION CRASH"
    );
    logger.debug({ error }, "🔬 Detailed error information");
    Deno.exit(1);
  }
}

// Handle uncaught errors
globalThis.addEventListener("unhandledrejection", (event) => {
  logError(`Unhandled promise rejection: ${event.reason}`, "RUNTIME ERROR");
  logger.debug({ reason: event.reason }, "🔬 Unhandled Rejection Details");
  Deno.exit(1);
});

globalThis.addEventListener("error", (event) => {
  logError(`Uncaught exception: ${event.error}`, "RUNTIME ERROR");
  logger.debug({ error: event.error }, "🔬 Uncaught Exception Details");
  Deno.exit(1);
});

// Start the application
await main();
await new Promise(() => {});
