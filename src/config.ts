import { EnvConfig } from "./types.ts";
import logger, { emojis } from "./pino-logger.ts";
import { processConfiguration } from "./config-logger.ts";
import { load } from "./deps.ts";

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
  logger.debug(`${emojis.config} Loading configuration from .env file`);
  
  try {
    // Load environment variables
    const env = (await load()) as unknown as EnvConfig;
    logger.debug(`${emojis.config} .env file loaded successfully`);
    
    // Create a copy of the default config
    const config = structuredClone(defaultConfig);
    
    // Override with environment variables if they exist
    if (env.RTSP_STREAM) {
      config.rtsp.url = env.RTSP_STREAM;
      logger.debug(`${emojis.config} RTSP stream URL set from .env`);
    }
    
    if (env.LOG_LEVEL) {
      config.logging.level = env.LOG_LEVEL;
      logger.debug(`${emojis.config} Log level set to ${env.LOG_LEVEL} from .env`);
    }
    
    if (env.MODEL_PATH) {
      config.model.path = env.MODEL_PATH;
      logger.debug(`${emojis.config} Model path set from .env`);
    }
    
    if (env.CONFIDENCE_THRESHOLD) {
      config.model.confidenceThreshold = parseFloat(env.CONFIDENCE_THRESHOLD);
      logger.debug(`${emojis.config} Confidence threshold set to ${env.CONFIDENCE_THRESHOLD} from .env`);
    }
    
    if (env.SAMPLE_RATE) {
      config.audio.sampleRate = parseInt(env.SAMPLE_RATE);
      logger.debug(`${emojis.config} Sample rate set to ${env.SAMPLE_RATE} from .env`);
    }
    
    // Process and validate the configuration
    processConfiguration(config, defaultConfig);
    
    return config;
  } catch (error) {
    logger.warn(
      { error }, 
      `${emojis.warning} Error loading .env file, using default configuration`
    );
    return defaultConfig;
  }
}