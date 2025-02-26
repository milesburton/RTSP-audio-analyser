import { pino, pinoPretty } from "./deps.ts";
import { getErrorMessage } from "./error-utils.ts";

// Deno-specific environment variable retrieval
const getEnv = (key: string, defaultValue: string = ''): string => {
  return Deno.env.get(key) ?? defaultValue;
};

// Validate and normalize log level
const rawLogLevel = getEnv('LOG_LEVEL', 'info').toLowerCase();
const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
type ValidLevel = typeof validLevels[number];

const logLevel: ValidLevel = (validLevels.includes(rawLogLevel as ValidLevel) 
  ? rawLogLevel 
  : 'info') as ValidLevel;

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
};

// Create a pretty stream for formatting
const prettyStream = pinoPretty({
  colorize: true,
  translateTime: 'SYS:standard',
  singleLine: false,
  ignore: 'pid,hostname,time,level',
  customColors: 'debug:blue,info:green,warn:yellow,error:red,fatal:magenta',
  messageFormat: (log, messageKey) => {
    // Remove emoji from message to prevent duplication
    const msg = log[messageKey] as string;
    if (typeof msg === 'string') {
      const cleanMsg = msg.replace(/^([\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}]+\s*)/u, '');
      return cleanMsg;
    }
    return msg;
  }
});

// Create a base logger with human-friendly pretty printing
const baseLogger = pino({
  level: logLevel,
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime
}, prettyStream);

// Log the current log level
baseLogger.info(`${emojis.config} [LOGGER] Log level set to: ${logLevel.toUpperCase()}`);

// Helper functions to add emojis to log messages
export function logDebug(obj: Record<string, unknown> | string, msg?: string): void {
  if (typeof obj === 'string') {
    baseLogger.debug(`${emojis.debug} ${obj}`);
  } else {
    baseLogger.debug(obj, `${emojis.debug} ${msg || 'Debug information'}`);
  }
}

export function logInfo(obj: Record<string, unknown> | string, msg?: string): void {
  if (typeof obj === 'string') {
    baseLogger.info(`${emojis.info} ${obj}`);
  } else {
    baseLogger.info(obj, `${emojis.info} ${msg || 'Information'}`);
  }
}

export function logWarn(obj: Record<string, unknown> | string, msg?: string): void {
  if (typeof obj === 'string') {
    baseLogger.warn(`${emojis.warning} ${obj}`);
  } else {
    baseLogger.warn(obj, `${emojis.warning} ${msg || 'Warning'}`);
  }
}

export function logError(obj: Record<string, unknown> | string, msg?: string | Error | unknown): void {
  if (typeof obj === 'string') {
    baseLogger.error(`${emojis.error} ${obj}`);
  } else {
    const errorMsg = typeof msg === 'string' 
      ? msg 
      : msg ? getErrorMessage(msg) : 'Error occurred';
    
    baseLogger.error(obj, `${emojis.error} ${errorMsg}`);
  }
}

export function logFatal(obj: Record<string, unknown> | string, msg?: string | Error | unknown): void {
  if (typeof obj === 'string') {
    baseLogger.fatal(`${emojis.fatal} ${obj}`);
  } else {
    const errorMsg = typeof msg === 'string' 
      ? msg 
      : msg ? getErrorMessage(msg) : 'Fatal error';
    
    baseLogger.fatal(obj, `${emojis.fatal} ${errorMsg}`);
  }
}

// Specialized logging functions
export function logAudioPreprocess(details: Record<string, unknown>): void {
  const msg = details.msg as string;
  const detailedMsgs: Record<string, string> = {
    'Audio signal statistics': 'Analyzing audio signal characteristics',
    'Sample count comparison': 'Verifying audio sample count',
    'Truncated audio data': 'Adjusting audio data to required length',
    'Created input tensor': 'Preparing audio data for model input',
    'Processing PCM samples': 'Converting PCM audio to float representation'
  };

  // Only log debug messages if debug level is active
  if (baseLogger.isLevelEnabled('debug')) {
    logDebug(details, detailedMsgs[msg] || msg || 'Audio preprocessing step');
  }
}

export function logModelLoading(details: Record<string, unknown>): void {
  logInfo(details, `${emojis.loading} Model Loading: ${details.modelUrl || 'Attempting to load model'}`);
}

export function logClassification(details: Record<string, unknown>): void {
  // Only log debug messages if debug level is active
  if (baseLogger.isLevelEnabled('debug')) {
    const topClasses = details.topClasses 
      ? (details.topClasses as Array<{label: string, confidence: number}>)
          .map(c => `${c.label} (${(c.confidence * 100).toFixed(2)}%)`) 
      : [];
    
    logDebug(
      { ...details, topClassesFormatted: topClasses }, 
      `${emojis.detection} Classification Result: ${details.label || 'Unknown'} (${(details.confidence as number * 100).toFixed(2)}%)`
    );
  }
}

export function logErrorContext(context: string, error: unknown): void {
  logError(
    { 
      context, 
      errorMessage: getErrorMessage(error) 
    }, 
    `Error in ${context}`
  );
}

// Configuration function
export function configureLogging() {
  logInfo(`${emojis.config} Current log level: ${logLevel.toUpperCase()}`);
  logInfo(`${emojis.info} Available log levels: ${validLevels.join(', ')}`);
  
  return {
    currentLevel: logLevel,
    printLogLevelInstructions: () => {
      logInfo(`${emojis.config} To change log level, set LOG_LEVEL environment variable:`);
      validLevels.forEach(level => {
        logInfo(`  ${emojis.config} export LOG_LEVEL=${level.toUpperCase()}  # ${level === 'info' ? 'Default level' : 'Set to ' + level} logs`);
      });
    },
    emojis
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
  level: baseLogger.level
};