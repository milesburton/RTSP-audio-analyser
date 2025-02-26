import { pino, pinoPretty, Logger } from "./deps.ts";
import adapterNodeStdOut from "./node-stdout-adapter.ts";
import { getErrorMessage } from "./error-utils.ts";

// Deno-specific environment variable retrieval
const getEnv = (key: string, defaultValue: string = ""): string => {
  return Deno.env.get(key) ?? defaultValue;
};

// Validate and normalize log level
const validLevels = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
] as const;
type ValidLevel = (typeof validLevels)[number];

// Precise type definitions for Pino-specific structures
type PinoLogLevel = (typeof validLevels)[number];

interface PinoLogObject {
  level: PinoLogLevel;
  msg: string;
  time: number;
  [key: string]: unknown;
}

interface PinoMessageFormatContext {
  log: PinoLogObject;
  messageKey: keyof PinoLogObject;
}

// Type for log objects with unknown properties
type LogObject = Record<string, unknown>;

// Type for classification result
interface ClassificationResult {
  label: string;
  confidence: number;
  topClasses?: Array<{ label: string; confidence: number }>;
}

// Raw log level processing
const rawLogLevel = getEnv("LOG_LEVEL", "info").toLowerCase();
const logLevel: ValidLevel = (
  validLevels.includes(rawLogLevel as ValidLevel) ? "debug" : "info"
) as ValidLevel;

// Emoji categories for different types of logs
export const emojis = {
  // System status emojis
  startup: "🚀",
  success: "✅",
  ready: "✨",
  running: "🏃",
  stopped: "🛑",

  // Informational emojis
  info: "ℹ️",
  debug: "🔍",
  trace: "🔬",
  detail: "🔎",
  stats: "📊",

  // Warning and error emojis
  warning: "⚠️",
  error: "🚨",
  fatal: "💥",
  critical: "❌",

  // Process emojis
  process: "⚙️",
  analyzing: "🧮",
  loading: "📂",
  saving: "💾",

  // Audio related emojis
  audio: "🎵",
  sound: "🔊",
  listening: "👂",
  detection: "🎯",

  // Hardware/resource emojis
  memory: "💾",
  cpu: "⚡",
  network: "🌐",
  database: "🗄️",

  // Misc emojis
  time: "⏱️",
  config: "🔧",
  data: "📄",
  model: "🧠",
} as const;

// Create a pretty stream for formatting
const prettyStream = pinoPretty({
  colorize: true,
  translateTime: "yyyy-mm-dd HH:MM:ss.l o", // More explicit time format
  singleLine: false,
  ignore: "pid,hostname",
  customColors: "debug:blue,info:green,warn:yellow,error:red,fatal:magenta",
  messageFormat: (context: PinoMessageFormatContext): string => {
    // Remove emoji from message to prevent duplication
    const msg = context.log[context.messageKey] as string;
    if (typeof msg === "string") {
      const cleanMsg = msg.replace(
        /^([\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}]+\s*)/u,
        ""
      );
      return cleanMsg;
    }

    return msg;
  },
}).pipe(adapterNodeStdOut);

// Create a base logger with human-friendly pretty printing
const baseLogger: Logger = pino(
  {
    level: logLevel,
    formatters: {
      level(label: PinoLogLevel) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  prettyStream
);

// Log the current log level
baseLogger.info(
  `${emojis.config} [LOGGER] Log level set to: ${logLevel.toUpperCase()}`
);

// Helper functions to add emojis to log messages
export function logDebug(obj: LogObject | string, msg?: string): void {
  if (typeof obj === "string") {
    baseLogger.debug(`${emojis.debug} ${obj}`);
  } else {
    baseLogger.debug(obj, `${emojis.debug} ${msg || "Debug information"}`);
  }
}

export function logInfo(obj: LogObject | string, msg?: string): void {
  if (typeof obj === "string") {
    baseLogger.info(`${emojis.info} ${obj}`);
  } else {
    baseLogger.info(obj, `${emojis.info} ${msg || "Information"}`);
  }
}

export function logWarn(obj: LogObject | string, msg?: string): void {
  if (typeof obj === "string") {
    baseLogger.warn(`${emojis.warning} ${obj}`);
  } else {
    baseLogger.warn(obj, `${emojis.warning} ${msg || "Warning"}`);
  }
}

export function logError(
  obj: LogObject | string,
  msg?: string | Error | unknown
): void {
  if (typeof obj === "string") {
    baseLogger.error(`${emojis.error} ${obj}`);
  } else {
    const errorMsg =
      typeof msg === "string"
        ? msg
        : msg
        ? getErrorMessage(msg)
        : "Error occurred";

    baseLogger.error(obj, `${emojis.error} ${errorMsg}`);
  }
}

export function logFatal(
  obj: LogObject | string,
  msg?: string | Error | unknown
): void {
  if (typeof obj === "string") {
    baseLogger.fatal(`${emojis.fatal} ${obj}`);
  } else {
    const errorMsg =
      typeof msg === "string"
        ? msg
        : msg
        ? getErrorMessage(msg)
        : "Fatal error";

    baseLogger.fatal(obj, `${emojis.fatal} ${errorMsg}`);
  }
}

// Specialized logging functions
export function logAudioPreprocess(details: LogObject): void {
  const msg = details.msg as string;
  const detailedMsgs: Record<string, string> = {
    "Audio signal statistics": "Analyzing audio signal characteristics",
    "Sample count comparison": "Verifying audio sample count",
    "Truncated audio data": "Adjusting audio data to required length",
    "Created input tensor": "Preparing audio data for model input",
    "Processing PCM samples": "Converting PCM audio to float representation",
  };

  // Only log debug messages if debug level is active
  if (baseLogger.isLevelEnabled("debug")) {
    logDebug(details, detailedMsgs[msg] || msg || "Audio preprocessing step");
  }
}

export function logModelLoading(details: LogObject): void {
  logInfo(
    details,
    `${emojis.loading} Model Loading: ${
      details.modelUrl || "Attempting to load model"
    }`
  );
}

export function logClassification(
  details: ClassificationResult & LogObject
): void {
  // Only log debug messages if debug level is active
  if (baseLogger.isLevelEnabled("debug")) {
    const topClasses = details.topClasses
      ? details.topClasses.map(
          (c) => `${c.label} (${(c.confidence * 100).toFixed(2)}%)`
        )
      : [];

    logDebug(
      { ...details, topClassesFormatted: topClasses },
      `${emojis.detection} Classification Result: ${
        details.label || "Unknown"
      } (${(details.confidence * 100).toFixed(2)}%)`
    );
  }
}

export function logErrorContext(context: string, error: unknown): void {
  logError(
    {
      context,
      errorMessage: getErrorMessage(error),
    },
    `Error in ${context}`
  );
}

// Configuration function
export function configureLogging() {
  logInfo(`${emojis.config} Current log level: ${logLevel.toUpperCase()}`);
  logInfo(`${emojis.info} Available log levels: ${validLevels.join(", ")}`);

  return {
    currentLevel: logLevel,
    printLogLevelInstructions: () => {
      logInfo(
        `${emojis.config} To change log level, set LOG_LEVEL environment variable:`
      );
      validLevels.forEach((level) => {
        logInfo(
          `  ${emojis.config} export LOG_LEVEL=${level.toUpperCase()}  # ${
            level === "info" ? "Default level" : "Set to " + level
          } logs`
        );
      });
    },
    emojis,
  };
}

// Export a simplified interface that other files can use
export default {
  trace: baseLogger.trace.bind(baseLogger),
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  fatal: logFatal,
  isLevelEnabled: baseLogger.isLevelEnabled.bind(baseLogger),
  level: baseLogger.level,
};
