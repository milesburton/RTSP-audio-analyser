import { load } from "https://deno.land/std/dotenv/mod.ts";
import { tf } from "./deps.ts";

// Type definitions
interface EnvConfig {
  RTSP_STREAM: string;
  DETECTION_TYPE?: string;
}

interface DetectionResult {
  isDetected: boolean;
  confidence: number;
}

// Load environment variables from .env file
const env = await load() as EnvConfig;
const rtspStream = env.RTSP_STREAM;
const detectionType = env.DETECTION_TYPE || "dog_bark";

if (!rtspStream) {
  console.error("RTSP_STREAM is not defined in your .env file.");
  Deno.exit(1);
}

// Ensure the logs directory exists
try {
  await Deno.mkdir("logs", { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.AlreadyExists)) {
    console.error("Failed to create logs directory:", error);
    Deno.exit(1);
  }
}

/**
 * Generic event detection function.
 * @param audioChunk Raw audio data
 * @returns Detection result with confidence score
 */
async function detectEvent(audioChunk: Uint8Array): Promise<DetectionResult> {
  try {
    // Convert raw audio (0-255) to a normalized float32 array
    const floatArray = Float32Array.from(audioChunk, (val) => val / 255);
    const input = tf.tensor1d(Array.from(floatArray));
    const mean = (await input.mean().data())[0];
    input.dispose();

    // Detection logic based on type
    switch (detectionType) {
      case "dog_bark":
        return {
          isDetected: mean > 0.5,
          confidence: mean
        };
      // Add cases for other detection types here
      default:
        return {
          isDetected: false,
          confidence: 0
        };
    }
  } catch (error) {
    console.error("Error in detection:", error);
    return {
      isDetected: false,
      confidence: 0
    };
  }
}

/**
 * Process the RTSP stream audio using ffmpeg.
 */
async function processStream(): Promise<void> {
  console.log(`Starting RTSP stream processing...
Stream: ${rtspStream}
Detection type: ${detectionType}`);

  const ffmpegProcess = new Deno.Command("ffmpeg", {
    args: [
      "-i", rtspStream,
      "-vn",           // disable video
      "-acodec", "pcm_s16le",
      "-ar", "16000",  // sample rate
      "-ac", "1",      // mono channel
      "-f", "s16le",   // raw audio format
      "pipe:1"
    ],
    stdout: "piped",
    stderr: "null"     // change to "piped" for debugging
  });

  const process = ffmpegProcess.spawn();
  const reader = process.stdout.getReader();
  const bufferSize = 4096;
  const buf = new Uint8Array(bufferSize);

  try {
    while (true) {
      const { value: chunk, done } = await reader.read();
      if (done) break;

      const result = await detectEvent(chunk);
      if (result.isDetected) {
        const now = new Date();
        const logMessage = `${now.toISOString()}: ${detectionType} detected (confidence: ${result.confidence.toFixed(2)})\n`;
        
        await Deno.writeTextFile("logs/detections.log", logMessage, { append: true });
        console.log(logMessage);
      }
    }
  } catch (error) {
    console.error("Error processing stream:", error);
  } finally {
    reader.releaseLock();
    process.kill();
  }
}

// Start processing
await processStream();