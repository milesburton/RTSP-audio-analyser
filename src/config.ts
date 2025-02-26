import { load, z } from "./deps.ts";
import logger, { emojis } from "./pino-logger.ts";
import { processConfiguration } from "./config-logger.ts";

/**
 * Zod schema for validating environment configuration
 * Uses coercion to handle type conversion and optional values
 */
const EnvConfigSchema = z.object({
  // RTSP Configuration
  RTSP_STREAM: z.string().optional(),

  // Logging Configuration
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),

  // Model Configuration
  MODEL_PATH: z.string().optional(),
  CONFIDENCE_THRESHOLD: z.coerce.number().optional(),
  KNOWN_THRESHOLD: z.coerce.number().optional(),
  LOG_THRESHOLD: z.coerce.number().optional(),

  // Audio Configuration
  SAMPLE_RATE: z.coerce.number().optional(),
  FRAME_DURATION: z.coerce.number().optional(),
  BUFFER_SIZE: z.coerce.number().optional(),
  CHUNK_SIZE: z.coerce.number().optional(),
  PROCESS_INTERVAL: z.coerce.number().optional(),

  // Detection Configuration
  PERSISTENCE_TIME: z.coerce.number().optional(),
  INTERESTING_SOUNDS: z.string().optional(),
  IGNORE_SOUNDS: z.string().optional(),
});

/**
 * Application configuration interface
 */
export interface AppConfig {
  audio: {
    sampleRate: number;
    frameDuration: number;
    bufferSize: number;
    chunkSize: number;
    processInterval: number;
  };

  model: {
    path: string;
    confidenceThreshold: number;
    knownThreshold: number;
    logThreshold: number;
  };

  logging: {
    level: "debug" | "info" | "warn" | "error";
    logInterval: number;
    prettyPrint: boolean;
    colorize: boolean;
  };

  rtsp: {
    url: string;
    transport: "tcp" | "udp";
    reconnect: boolean;
    reconnectDelay: number;
  };

  detection: {
    persistenceTime: number;
    interestingSounds: string[];
    ignoreSounds: string[];
  };
}

/**
 * Default configuration with sensible defaults
 */
const DEFAULT_CONFIG: AppConfig = {
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
      "Dog",
      "Bark",
      "Person",
      "Speech",
      "Alarm",
      "Siren",
      "Glass",
      "Shatter",
      "Gunshot, gunfire",
      "Explosion",
    ],
    ignoreSounds: ["Silence", "Noise", "Static", "Environmental noise"],
  },
};

// Cached configuration to prevent multiple loads
let cachedConfig: AppConfig | null = null;

/**
 * Parse comma-separated string into an array of trimmed, non-empty strings
 */
function parseCommaSeparatedString(value?: string): string[] {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

/**
 * Load and validate configuration from environment variables
 */
export async function loadConfig(): Promise<AppConfig> {
  // Return cached config if already loaded
  if (cachedConfig) {
    return cachedConfig;
  }

  logger.debug(`${emojis.config} Loading configuration`);

  try {
    // Load environment variables
    const loadedEnv = await load();

    // Validate environment configuration
    const parsedEnv = EnvConfigSchema.parse(loadedEnv);

    // Create a deep copy of the default config
    const config: AppConfig = structuredClone(DEFAULT_CONFIG);

    logger.error(`Using config: ${JSON.stringify(config, null, 2)}`);

    // Helper function to update config with optional env vars
    const updateIfPresent = <
      K extends keyof AppConfig,
      T extends keyof AppConfig[K]
    >(
      category: K,
      key: T,
      envValue: unknown,
      logMessage: string
    ) => {
      if (envValue !== undefined) {
        config[category][key] = envValue as AppConfig[K][T];
        logger.debug(`${emojis.config} ${logMessage} from .env`);
      }
    };

    // Update configuration with environment variables
    updateIfPresent(
      "rtsp",
      "url",
      parsedEnv.RTSP_STREAM,
      "RTSP stream URL set"
    );
    updateIfPresent(
      "logging",
      "level",
      parsedEnv.LOG_LEVEL,
      `Log level set to ${parsedEnv.LOG_LEVEL}`
    );
    updateIfPresent("model", "path", parsedEnv.MODEL_PATH, "Model path set");

    // Numeric configurations
    updateIfPresent(
      "model",
      "confidenceThreshold",
      parsedEnv.CONFIDENCE_THRESHOLD,
      `Confidence threshold set to ${parsedEnv.CONFIDENCE_THRESHOLD}`
    );
    updateIfPresent(
      "model",
      "knownThreshold",
      parsedEnv.KNOWN_THRESHOLD,
      `Known threshold set to ${parsedEnv.KNOWN_THRESHOLD}`
    );
    updateIfPresent(
      "model",
      "logThreshold",
      parsedEnv.LOG_THRESHOLD,
      `Log threshold set to ${parsedEnv.LOG_THRESHOLD}`
    );

    // Audio configurations
    updateIfPresent(
      "audio",
      "sampleRate",
      parsedEnv.SAMPLE_RATE,
      `Sample rate set to ${parsedEnv.SAMPLE_RATE}`
    );
    updateIfPresent(
      "audio",
      "frameDuration",
      parsedEnv.FRAME_DURATION,
      `Frame duration set to ${parsedEnv.FRAME_DURATION}`
    );
    updateIfPresent(
      "audio",
      "bufferSize",
      parsedEnv.BUFFER_SIZE,
      `Buffer size set to ${parsedEnv.BUFFER_SIZE}`
    );
    updateIfPresent(
      "audio",
      "chunkSize",
      parsedEnv.CHUNK_SIZE,
      `Chunk size set to ${parsedEnv.CHUNK_SIZE}`
    );
    updateIfPresent(
      "audio",
      "processInterval",
      parsedEnv.PROCESS_INTERVAL,
      `Process interval set to ${parsedEnv.PROCESS_INTERVAL}`
    );

    // Detection configurations
    updateIfPresent(
      "detection",
      "persistenceTime",
      parsedEnv.PERSISTENCE_TIME,
      `Persistence time set to ${parsedEnv.PERSISTENCE_TIME}`
    );

    // Parse comma-separated sounds lists
    if (parsedEnv.INTERESTING_SOUNDS) {
      config.detection.interestingSounds = parseCommaSeparatedString(
        parsedEnv.INTERESTING_SOUNDS
      );
      logger.debug(`${emojis.config} Interesting sounds updated from .env`);
    }

    if (parsedEnv.IGNORE_SOUNDS) {
      config.detection.ignoreSounds = parseCommaSeparatedString(
        parsedEnv.IGNORE_SOUNDS
      );
      logger.debug(`${emojis.config} Ignored sounds updated from .env`);
    }

    // Process and validate the configuration
    processConfiguration(config, DEFAULT_CONFIG);

    // Cache the config
    cachedConfig = config;

    return config;
  } catch (error) {
    logger.warn(
      { error },
      `${emojis.warning} Error loading configuration, using default configuration`
    );

    // Cache the default config
    cachedConfig = DEFAULT_CONFIG;

    return DEFAULT_CONFIG;
  }
}

/**
 * Reset the cached configuration (primarily for testing purposes)
 */
export function resetConfig(): void {
  cachedConfig = null;
}
