import { tf } from "./deps.ts";
import { ModelConfig } from "./types.ts";
import { classifyAudio } from "./model.ts";
import { sanitiseRtspUrl } from "./url-sanitiser.ts";
import { getEmojiForLabel } from "./emoji-mappings.ts";
import { loadConfig } from "./config.ts";
import type { Logger } from "https://esm.sh/pino@8.15.6?bundle";

export async function processStream(
  model: tf.GraphModel,
  rtspStream: string,
  modelConfig: ModelConfig,
  logger: Logger
): Promise<void> {
  // Load application config
  const config = await loadConfig();
  
  const sanitisedUrl = sanitiseRtspUrl(rtspStream);
  logger.info(`🎤 Starting RTSP stream processing: ${sanitisedUrl}`);

  // Verify if the RTSP stream is accessible first
  await verifyRtspStream(rtspStream, logger);

  // Start FFmpeg process
  const ffmpegProcess = startFfmpegProcess(rtspStream, config, logger);
  const ffmpegProcessStdoutReader = ffmpegProcess.stdout.getReader();
  const ffmpegProcessStderrReader = ffmpegProcess.stderr.getReader();

  // Log FFmpeg stderr in background
  logFfmpegStderr(ffmpegProcessStderrReader, logger);

  // Statistics for monitoring
  let totalChunks = 0;
  let detections = 0;
  let errors = 0;
  let lastLogTime = Date.now();
  const LOG_INTERVAL = config.logging.logInterval;
  const CHUNK_SIZE = modelConfig.sampleRate * 2; // 1 second of audio at configured sample rate

  // For persistence tracking (avoid re-logging the same sound)
  const recentDetections = new Map<string, number>();

  try {
    // Buffer to accumulate audio samples
    let buffer = new Uint8Array(0);
    let lastProcessTime = Date.now();
    const PROCESS_INTERVAL = config.audio.processInterval;
    
    while (true) {
      logger.debug("🔄 Reading audio chunk");
      const { value: chunk, done } = await ffmpegProcessStdoutReader.read();
      
      if (done) {
        logger.info("🏁 End of stream reached");
        break;
      }
      
      // Append new data to existing buffer
      const newBuffer = new Uint8Array(buffer.length + chunk.length);
      newBuffer.set(buffer);
      newBuffer.set(chunk, buffer.length);
      buffer = newBuffer;
      
      logger.debug(`🧩 Buffer size: ${buffer.length}, Chunk size: ${chunk?.length}`);
      
      // Process chunks if we have enough data OR if it's been too long since last process
      const timeElapsed = Date.now() - lastProcessTime;
      const shouldProcess = buffer.length >= CHUNK_SIZE || (buffer.length > 0 && timeElapsed > PROCESS_INTERVAL);
      
      if (shouldProcess) {
        // Use as much of the buffer as we can, but ensure minimum size
        if (buffer.length >= config.audio.chunkSize) {
          // Process the entire buffer rather than slicing it
          const audioChunk = buffer;
          buffer = new Uint8Array(0); // Clear buffer after processing
          totalChunks++;
          lastProcessTime = Date.now();
          
          logger.debug(`🔊 Processing audio chunk: ${audioChunk.length} bytes`);
          
          try {
            const result = await classifyAudio(model, audioChunk, modelConfig);
            
            if (result.isDetected) {
              detections++;
              const emoji = getEmojiForLabel(result.label);
              
              // Check if this is a sound we should ignore
              const shouldIgnore = config.detection.ignoreSounds.includes(result.label);
              
              // Check if we've recently detected this sound
              const lastDetectionTime = recentDetections.get(result.label) || 0;
              const timeSinceLastDetection = Date.now() - lastDetectionTime;
              const isRecentlyDetected = timeSinceLastDetection < config.detection.persistenceTime;
              
              // We only want to log interesting detected sounds with high confidence
              // and not too frequently to avoid spamming the logs
              const isInterestingSound = config.detection.interestingSounds.includes(result.label);
              const highConfidence = result.confidence > config.model.logThreshold;
              
              if ((highConfidence || isInterestingSound) && !shouldIgnore && !isRecentlyDetected) {
                // Update the last detection time for this sound
                recentDetections.set(result.label, Date.now());
                
                logger.info(
                  { 
                    label: result.label,
                    confidence: result.confidence.toFixed(2),
                    isKnown: result.isKnown 
                  }, 
                  `${emoji} Sound detected: ${result.label}`
                );
                
                if (result.isKnown) {
                  // Log detection to file
                  const timestamp = new Date().toISOString();
                  const logMessage = `${timestamp}: ${emoji} ${
                    result.label
                  } detected (confidence: ${result.confidence.toFixed(2)})\n`;
                  
                  await Deno.writeTextFile("logs/detections.log", logMessage, {
                    append: true,
                  });
                }
              } else {
                // For lower confidence detections, just log at debug level
                logger.debug(
                  { 
                    label: result.label,
                    confidence: result.confidence.toFixed(2),
                    ignored: shouldIgnore,
                    recent: isRecentlyDetected
                  }, 
                  `🤫 Sound detected (not logged): ${result.label}`
                );
              }
            }
          } catch (classifyError) {
            errors++;
            logger.error({ error: classifyError }, "❌ Error classifying audio");
          }
        } else {
          logger.debug(`🧬 Buffer too small: ${buffer.length}, continuing to accumulate`);
        }
      }
      
      // Output processing statistics periodically
      if (Date.now() - lastLogTime > LOG_INTERVAL) {
        logger.info(
          { 
            totalChunks, 
            detections, 
            errors,
            bufferSize: buffer.length
          }, 
          "📊 Processing statistics"
        );
        lastLogTime = Date.now();
      }
    }
  } catch (error) {
    logger.error({ error }, "💥 Stream processing error");
  } finally {
    ffmpegProcessStdoutReader.releaseLock();
    try {
      logger.info("🔪 Attempting to kill FFmpeg process...");
      ffmpegProcess.kill();
      logger.info("✅ FFmpeg process kill signal sent.");
    } catch (killError) {
      logger.error({ error: killError }, "⚠️ Error killing ffmpeg process");
    }
    
    logger.info(
      { 
        totalChunks, 
        detections, 
        errors
      }, 
      "🏁 Stream processing finished"
    );
  }
}

async function verifyRtspStream(rtspStream: string, logger: Logger): Promise<void> {
  try {
    logger.info("🔍 Verifying RTSP stream availability...");
    
    const ffprobeCommand = new Deno.Command("ffprobe", {
      args: [
        "-v", "error",
        "-rtsp_transport", "tcp",
        "-i", rtspStream,
        "-show_entries", "stream=codec_type",
        "-of", "default=noprint_wrappers=1:nokey=1",
      ],
      stderr: "piped",
    });
    
    const ffprobeOutput = await ffprobeCommand.output();
    if (ffprobeOutput.stderr.length > 0) {
      const errorMsg = new TextDecoder().decode(ffprobeOutput.stderr);
      logger.warn({ error: errorMsg }, "⚠️ RTSP stream may not be accessible");
    } else {
      logger.info("✅ RTSP stream verified");
    }
  } catch (error) {
    logger.warn({ error }, "⚠️ Failed to verify RTSP stream, attempting to process anyway");
  }
}

function startFfmpegProcess(rtspStream: string, config: any, logger: Logger): Deno.ChildProcess {
  const ffmpegCommand = new Deno.Command("ffmpeg", {
    args: [
      "-rtsp_transport", config.rtsp.transport,
      "-i", rtspStream,
      "-vn", // disable video
      "-acodec", "pcm_s16le",
      "-ar", config.audio.sampleRate.toString(), // sample rate
      "-ac", "1", // mono channel
      "-f", "s16le", // raw audio format
      "-bufsize", `${config.audio.bufferSize}k`, // buffer size
      ...(config.rtsp.reconnect ? [
        "-reconnect", "1",
        "-reconnect_at_eof", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", config.rtsp.reconnectDelay.toString()
      ] : []),
      "pipe:1", // output to stdout
    ],
    stdout: "piped",
    stderr: "piped",
  });

  return ffmpegCommand.spawn();
}

async function logFfmpegStderr(
  stderrReader: ReadableStreamDefaultReader<Uint8Array>,
  logger: Logger
): Promise<void> {
  try {
    while (true) {
      const { value, done } = await stderrReader.read();
      if (done) break;
      const message = new TextDecoder().decode(value);
      
      // Only log actual errors, not information messages
      if (message.includes("Error") || message.includes("error")) {
        logger.error({ ffmpegError: message }, "🔴 FFmpeg Error");
      } else {
        logger.debug({ ffmpegInfo: message }, "🎬 FFmpeg Info");
      }
    }
  } catch (err) {
    logger.error({ error: err }, "💥 Error reading FFmpeg stderr");
  } finally {
    stderrReader.releaseLock();
  }
}