import pino from "https://esm.sh/pino@8.15.6?bundle";
import { tf, load, tfReady } from "./deps.ts";
import { loadModel, classifyAudio } from "./model.ts";
import { EnvConfig, ModelConfig } from "./types.ts";
import { sanitiseRtspUrl } from "./url-sanitiser.ts";

const env = (await load()) as unknown as EnvConfig;
const rtspStream = env.RTSP_STREAM;

if (!rtspStream) {
  console.error("RTSP_STREAM must be defined in your .env file.");
  Deno.exit(1);
}

const logger = pino({
  level: "debug",
});

const modelConfig: ModelConfig = {
  modelUrl: "./yamnet_conversion/yamnet_tfjs/model.json",
  labels: [
    "Speech",
    "Male speech",
    "Female speech",
    "Child speech",
    "Conversation",
    "Dog",
    "Bark",
    "Howl",
    "Cat",
    "Meow",
    "Vehicle",
    "Car",
    "Car alarm",
    "Siren",
    "Ambulance (siren)",
    "Police car (siren)",
    "Music",
    "Musical instrument",
    "Bird",
    "Bird vocalization, bird call, bird song",
    "Engine",
    "Door",
    "Bell",
    "Alarm",
    "Background noise",
  ],
  sampleRate: 16000,
  frameDuration: 1.0,
};

const emojiMap: Record<string, string> = {
  Speech: "🗣️",
  "Male speech": "🗣️👨",
  "Female speech": "🗣️👩",
  "Child speech": "🗣️🧒",
  Conversation: "💬",
  Dog: "🐕",
  Bark: "🐕‍🦺",
  Howl: "🐺",
  Cat: "🐈",
  Meow: "😼",
  Vehicle: "🚗",
  Car: "🚘",
  "Car alarm": "🚗🚨",
  Siren: "🚨",
  "Ambulance (siren)": "🚑",
  "Police car (siren)": "🚓",
  Music: "🎵",
  "Musical instrument": "🎸",
  Bird: "🐦",
  "Bird vocalization, bird call, bird song": "🐦🎶",
  Engine: "⚙️",
  Door: "🚪",
  Bell: "🔔",
  Alarm: "⏰",
  "Background noise": "🔊",
};


async function processStream(model: tf.GraphModel): Promise<void> {
  const sanitisedUrl = sanitiseRtspUrl(rtspStream);
  logger.info(
    { stream: sanitisedUrl, model: "YAMNet" },
    "Starting RTSP stream processing..."
  );

  // **Diagnostic Step (Optional, but recommended):**
  // Before running the script, use ffprobe to check the stream:
  // ffprobe -rtsp_transport tcp -i "your_rtsp_stream_url"

  const ffmpegCommand = new Deno.Command("ffmpeg", {
    args: [
      "-rtsp_transport", // Force TCP
      "tcp",
      "-i",
      rtspStream,
      "-vn", // disable video
      "-acodec",
      "pcm_s16le",
      "-ar",
      "16000", // sample rate
      "-ac",
      "1", // mono channel
      "-f",
      "s16le", // raw audio format
      "pipe:1",
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const ffmpegProcess = ffmpegCommand.spawn();
  const ffmpegProcessStdoutReader = ffmpegProcess.stdout.getReader();
  const ffmpegProcessStderrReader = ffmpegProcess.stderr.getReader();

  async function logStderr() {
    try {
      while (true) {
        const { value, done } = await ffmpegProcessStderrReader.read();
        if (done) break;
        const errorMessage = new TextDecoder().decode(value);
        logger.error({ ffmpegError: errorMessage }, "FFmpeg Error");
      }
    } catch (err) {
      logger.error({ error: err }, "Error reading FFmpeg stderr");
    } finally {
      ffmpegProcessStderrReader.releaseLock();
    }
  }

  logStderr();

  let totalChunks = 0;
  let detections = 0;
  let lastLogTime = Date.now();
  const LOG_INTERVAL = 5_000;

  try {
    while (true) {
      logger.debug("About to call reader.read()");
      const readStart = Date.now();
      const { value: chunk, done } = await ffmpegProcessStdoutReader.read();
      const readDuration = Date.now() - readStart;
      logger.debug(
        `reader.read() returned after ${readDuration} ms; done=${done}`
      );

      if (done) break;
      totalChunks++;

      const result = await classifyAudio(model, chunk, modelConfig);

      if (result.isDetected) {
        detections++;
        const emoji = emojiMap[result.label] || "❓";
        const logData = {
          label: result.label,
          confidence: result.confidence.toFixed(2),
          emoji,
          isKnown: result.isKnown,
        };

        logger.info(logData, `${emoji} Sound detected`);

        if (result.isKnown) {
          const logMessage = `${new Date().toISOString()}: ${emoji} ${
            result.label
          } detected (confidence: ${result.confidence.toFixed(2)})\n`;
          await Deno.writeTextFile("logs/detections.log", logMessage, {
            append: true,
          });
        }
      }

      if (Date.now() - lastLogTime > LOG_INTERVAL) {
        logger.info({ totalChunks, detections }, "📊 Processing statistics");
        lastLogTime = Date.now();
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("An unexpected error occurred", error);
    }
  } finally {
    ffmpegProcessStdoutReader.releaseLock();
    try {
      logger.info("Attempting to kill FFmpeg process...");
      ffmpegProcess.kill(); // Ensure process is killed
      logger.info("FFmpeg process kill signal sent.");
    } catch (killError) {
      if (killError instanceof Error) {
        logger.error(
          { error: killError.message },
          "⚠️ Error killing ffmpeg process"
        );
      }
    }
    logger.info({ totalChunks, detections }, "🏁 Stream processing finished");
  }
}

// Ensure logs directory exists
try {
  await Deno.mkdir("logs", { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.AlreadyExists)) {
    logger.fatal("Failed to create logs directory");
    Deno.exit(1);
  }
}

// Start processing
try {
  const model = await loadModel(modelConfig);
  await processStream(model);
} catch (error) {
  if (error instanceof Error) {
    logger.fatal(
      { error: error.message, stack: error.stack },
      "🔥 Fatal error"
    );
  }
  Deno.exit(1);
}
process.on("uncaughtException", (err) => {
  logger.fatal({ error: err.message, stack: err.stack }, "Uncaught Exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ promise, reason }, "Unhandled Rejection");
  process.exit(1);
});