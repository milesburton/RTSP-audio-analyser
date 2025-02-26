import { load } from "https://deno.land/std@0.217.0/dotenv/mod.ts";
import { EnvConfig } from "./types.ts";

/**
 * Application configuration
 */
export interface AppConfig {
  // Audio processing settings
  audio: {
    sampleRate: number;       // Sample rate in Hz
    frameDuration: number;    // Frame duration in seconds
    bufferSize: number;       // Audio buffer size in KB
    chunkSize: number;        // Minimum chunk size to process
    processInterval: number;  // How often to process audio (ms)
  };
  
  // Model settings
  model: {
    path: string;             // Path to the model file
    confidenceThreshold: number; // Threshold for detection
    knownThreshold: number;   // Threshold for known sounds
    logThreshold: number;     // Threshold for logging
  };
  
  // Logging settings
  logging: {
    level: string;            // Log level (debug, info, warn, error)
    logInterval: number;      // How often to log stats (ms)
    prettyPrint: boolean;     // Whether to use pretty printing
    colorize: boolean;        // Whether to colorize logs
  };
  
  // RTSP stream settings
  rtsp: {
    url: string;              // RTSP stream URL
    transport: string;        // RTSP transport (tcp, udp)
    reconnect: boolean;       // Whether to reconnect on failure
    reconnectDelay: number;   // Delay between reconnection attempts (s)
  };
  
  // Detection settings
  detection: {
    persistenceTime: number;  // Time to wait before re-logging same sound (ms)
    interestingSounds: string[]; // List of sounds to prioritize
    ignoreSounds: string[];   // List of sounds to ignore
  };
}

/**
 * Default configuration
 */
const defaultConfig: AppConfig = {
  audio: {
    sampleRate: 16000,
    frameDuration: 0.975,
    bufferSize: 2048,
    chunkSize: 8000,
    processInterval: 1000,
  },
  model: {
    path: "./yamnet_conversion/yamnet_tfjs/model.json",
    confidenceThreshold: 0.7,
    knownThreshold: 0.5,
    logThreshold: 0.75,
  },
  logging: {
    level: "debug",
    logInterval: 5000,
    prettyPrint: true,
    colorize: true,
  },
  rtsp: {
    url: "",
    transport: "tcp",
    reconnect: true,
    reconnectDelay: 5,
  },
  detection: {
    persistenceTime: 10000,
    interestingSounds: [
      "Dog", "Bark", "Person", "Speech", "Alarm", "Siren", 
      "Glass", "Shatter", "Gunshot, gunfire", "Explosion"
    ],
    ignoreSounds: [
      "Silence", "Noise", "Static", "Environmental noise"
    ],
  },
};

/**
 * Load configuration from environment
 */
export async function loadConfig(): Promise<AppConfig> {
  // Load environment variables
  const env = (await load()) as unknown as EnvConfig;
  
  // Create a copy of the default config
  const config = structuredClone(defaultConfig);
  
  // Override with environment variables if they exist
  if (env.RTSP_STREAM) {
    config.rtsp.url = env.RTSP_STREAM;
  }
  
  if (env.LOG_LEVEL) {
    config.logging.level = env.LOG_LEVEL;
  }
  
  if (env.MODEL_PATH) {
    config.model.path = env.MODEL_PATH;
  }
  
  if (env.CONFIDENCE_THRESHOLD) {
    config.model.confidenceThreshold = parseFloat(env.CONFIDENCE_THRESHOLD);
  }
  
  if (env.SAMPLE_RATE) {
    config.audio.sampleRate = parseInt(env.SAMPLE_RATE);
  }
  
  // Add additional environment variable overrides as needed
  
  return config;
}