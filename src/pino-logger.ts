import pino from "https://esm.sh/pino@8.15.6";
import pinoPretty from "https://esm.sh/pino-pretty@10.2.0";
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

// Create a base logger with human-friendly pretty printing
const baseLogger = pino(
  {
    level: logLevel,
    formatters: {
      level(label, number) {
        return { level: number };
      }
    },
    timestamp: pino.stdTimeFunctions.isoTime
  },
  pinoPretty({
    colorize: true,
    translateTime: 'SYS:standard',
    singleLine: false,
    ignore: 'pid,hostname,time,level',
    customColors: 'debug:blue,info:green,warn:yellow,error:red,fatal:magenta',
    messageFormat: (log, messageKey) => {
      // Remove emoji from message to prevent duplication
      const msg = log[messageKey] as string;
      const cleanMsg = msg.replace(/^(🔍|ℹ️|⚠️|🚨|💥)\s*/, '');
      return cleanMsg;
    }
  })
);

// Log the current log level using Pino
baseLogger.info(`📊 [LOGGER] Log level set to: ${logLevel.toUpperCase()}`);

// Create a wrapper logger that adds emoji support while maintaining Pino.Logger interface
const logger: pino.Logger = {
  trace: (objOrMsg: LogObject | LogMessage, msg?: LogMessage) => {
    if (logLevel === 'trace') {
      if (typeof objOrMsg === 'string') {
        baseLogger.trace(`🔬 ${objOrMsg}`);
      } else {
        baseLogger.trace(objOrMsg, `🔬 ${msg || 'Trace information'}`);
      }
    }
  },
  
  debug: (objOrMsg: LogObject | LogMessage, msg?: LogMessage) => {
    if (logLevel === 'debug') {
      if (typeof objOrMsg === 'string') {
        baseLogger.debug(`🔍 ${objOrMsg}`);
      } else {
        baseLogger.debug(objOrMsg, `🔍 ${msg || 'Debug information'}`);
      }
    }
  },
  
  info: (objOrMsg: LogObject | LogMessage, msg?: LogMessage) => {
    if (typeof objOrMsg === 'string') {
      baseLogger.info(`ℹ️ ${objOrMsg}`);
    } else {
      baseLogger.info(objOrMsg, `ℹ️ ${msg || 'Information'}`);
    }
  },
  
  warn: (objOrMsg: LogObject | LogMessage, msg?: LogMessage) => {
    if (typeof objOrMsg === 'string') {
      baseLogger.warn(`⚠️ ${objOrMsg}`);
    } else {
      baseLogger.warn(objOrMsg, `⚠️ ${msg || 'Warning'}`);
    }
  },
  
  error: (objOrMsg: LogObject | LogMessage, msg?: MaybeError) => {
    if (typeof objOrMsg === 'string') {
      baseLogger.error(`🚨 ${objOrMsg}`);
    } else {
      const errorMsg = typeof msg === 'string' 
        ? msg 
        : msg ? getErrorMessage(msg) : 'Error occurred';
      
      baseLogger.error(objOrMsg, `🚨 ${errorMsg}`);
    }
  },
  
  fatal: (objOrMsg: LogObject | LogMessage, msg?: MaybeError) => {
    if (typeof objOrMsg === 'string') {
      baseLogger.fatal(`💥 ${objOrMsg}`);
    } else {
      const errorMsg = typeof msg === 'string' 
        ? msg 
        : msg ? getErrorMessage(msg) : 'Fatal error';
      
      baseLogger.fatal(objOrMsg, `💥 ${errorMsg}`);
    }
  },

  // Delegate other Pino.Logger methods to baseLogger
  level: baseLogger.level,
  silent: baseLogger.silent,
  
  child: (bindings) => baseLogger.child(bindings),
  bindings: (props) => baseLogger.bindings(props),
  isLevelEnabled: (level) => baseLogger.isLevelEnabled(level),
};

// Define types
type LogObject = Record<string, unknown>;
type LogMessage = string;
type MaybeError = string | Error | undefined;

// Specialized logging functions
export const logAudioPreprocess = (_details: LogObject) => {
  const msg = _details.msg as string;
  const detailedMsgs: Record<string, string> = {
    'Audio signal statistics': 'Analyzing audio signal characteristics',
    'Sample count comparison': 'Verifying audio sample count',
    'Truncated audio data': 'Adjusting audio data to required length',
    'Created input tensor': 'Preparing audio data for model input',
    'Processing PCM samples': 'Converting PCM audio to float representation'
  };

  // Only log debug messages if debug level is active
  if (logLevel === 'debug') {
    logger.debug(_details, detailedMsgs[msg] || msg || 'Audio preprocessing step');
  }
};

export const logModelLoading = (_details: LogObject) => {
  logger.info(_details, `Model Loading: ${_details.modelUrl || 'Attempting to load model'}`);
};

export const logClassification = (_details: LogObject) => {
  // Only log debug messages if debug level is active
  if (logLevel === 'debug') {
    const topClasses = _details.topClasses 
      ? (_details.topClasses as Array<{label: string, confidence: number}>)
          .map(c => `${c.label} (${(c.confidence * 100).toFixed(2)}%)`) 
      : [];
    
    logger.debug(
      { ..._details, topClassesFormatted: topClasses }, 
      `Classification Result: ${_details.label || 'Unknown'} (${(_details.confidence as number * 100).toFixed(2)}%)`
    );
  }
};

export const logError = (_context: string, error: unknown) => {
  logger.error(
    { 
      context: _context, 
      errorMessage: getErrorMessage(error) 
    }, 
    `Error in ${_context}`
  );
};

// Configuration function
export function configureLogging() {
  logger.info(`📊 Current log level: ${logLevel.toUpperCase()}`);
  logger.info(`📋 Available log levels: ${validLevels.join(', ')}`);
  
  return {
    currentLevel: logLevel,
    printLogLevelInstructions: () => {
      logger.info('🛠️ To change log level, set LOG_LEVEL environment variable:');
      validLevels.forEach(level => {
        logger.info(`  🔧 export LOG_LEVEL=${level.toUpperCase()}  # ${level === 'info' ? 'Default level' : 'Set to ' + level} logs`);
      });
    }
  };
}

export default logger;