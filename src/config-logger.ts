import logger, { emojis } from "./pino-logger.ts";
import { AppConfig } from "./config.ts";
import { logInfo } from "./boxen-logger.ts";

/**
 * Utility to log configuration in a structured, redacted way
 * @param config The application configuration
 * @param source The source of the configuration (e.g., ".env file", "defaults")
 */
export function logConfiguration(config: AppConfig, source: string = "configuration"): void {
  // Create a redacted copy of the config to avoid logging sensitive information
  const redactedConfig = structuredClone(config);
  
  // Redact any sensitive fields (like RTSP URL credentials)
  if (redactedConfig.rtsp.url) {
    const rtspUrl = redactedConfig.rtsp.url;
    // Simple redaction for passwords in RTSP URLs
    redactedConfig.rtsp.url = rtspUrl.replace(
      /rtsp:\/\/([^:]+):([^@]+)@/,
      'rtsp://[username]:[password]@'
    );
  }
  
  // Log configuration at different levels of detail
  logger.info(`${emojis.config} Loaded application ${source}`);
  
  // Display a summary of the most important configuration values
  logInfo(
    `RTSP Stream: ${redactedConfig.rtsp.url || 'Not configured'}\n` +
    `Log Level: ${redactedConfig.logging.level.toUpperCase()}\n` + 
    `Sample Rate: ${redactedConfig.audio.sampleRate} Hz\n` +
    `Confidence Threshold: ${redactedConfig.model.confidenceThreshold}\n` +
    `Model Path: ${redactedConfig.model.path}`,
    `${emojis.config} CONFIGURATION SUMMARY`
  );
  
  // Log the full configuration at debug level for troubleshooting
  logger.debug({ config: redactedConfig }, "Full application configuration");
}

/**
 * Logs changes to configuration from defaults
 * @param actualConfig The current configuration with overrides applied
 * @param defaultConfig The default configuration
 */
export function logConfigChanges(actualConfig: AppConfig, defaultConfig: AppConfig): void {
  // Find properties that differ from defaults
  const changes: Record<string, { current: unknown; default: unknown }> = {};
  
  // Helper function to check differences recursively
  function findDifferences(actual: any, defaults: any, path: string = '') {
    if (actual === undefined || defaults === undefined) return;
    
    if (typeof actual === 'object' && actual !== null && 
        typeof defaults === 'object' && defaults !== null) {
      // Both are objects, recurse into their properties
      Object.keys(actual).forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        findDifferences(actual[key], defaults[key], newPath);
      });
    } else if (actual !== defaults) {
      // Values differ, record the change
      changes[path] = {
        current: actual,
        default: defaults
      };
    }
  }
  
  findDifferences(actualConfig, defaultConfig);
  
  // Log changes if any
  if (Object.keys(changes).length > 0) {
    logger.info(`${emojis.config} Configuration overrides found:`);
    
    // Log each change individually
    Object.entries(changes).forEach(([path, { current, default: defaultValue }]) => {
      // Redact sensitive information
      if (path === 'rtsp.url' && typeof current === 'string') {
        current = current.replace(
          /rtsp:\/\/([^:]+):([^@]+)@/,
          'rtsp://[username]:[password]@'
        );
      }
      
      logger.info(
        `  ${emojis.config} ${path}: ${defaultValue} → ${current}`
      );
    });
  } else {
    logger.debug(`${emojis.config} Using default configuration (no overrides)`);
  }
}

/**
 * Validates configuration and logs any issues found
 * @param config The configuration to validate
 * @returns Array of validation errors, empty if valid
 */
export function validateConfiguration(config: AppConfig): string[] {
  const errors: string[] = [];
  
  // Check required fields
  if (!config.rtsp.url) {
    errors.push("RTSP stream URL is not configured");
  }
  
  // Check value ranges
  if (config.model.confidenceThreshold < 0 || config.model.confidenceThreshold > 1) {
    errors.push(`Confidence threshold must be between 0 and 1 (got ${config.model.confidenceThreshold})`);
  }
  
  if (config.audio.sampleRate < 8000 || config.audio.sampleRate > 48000) {
    errors.push(`Sample rate should be between 8000 and 48000 Hz (got ${config.audio.sampleRate})`);
  }
  
  // Log any validation errors
  if (errors.length > 0) {
    logger.warn(`${emojis.warning} Configuration validation found ${errors.length} issue(s):`);
    errors.forEach(error => {
      logger.warn(`  ${emojis.warning} ${error}`);
    });
  } else {
    logger.debug(`${emojis.success} Configuration validation passed`);
  }
  
  return errors;
}

/**
 * All-in-one function to process and log configuration
 * @param config The current configuration
 * @param defaultConfig The default configuration
 * @returns Whether the configuration is valid
 */
export function processConfiguration(
  config: AppConfig, 
  defaultConfig: AppConfig
): boolean {
  // Log the configuration
  logConfiguration(config);
  
  // Log changes from defaults
  logConfigChanges(config, defaultConfig);
  
  // Validate the configuration
  const errors = validateConfiguration(config);
  
  return errors.length === 0;
}

export default {
  logConfiguration,
  logConfigChanges,
  validateConfiguration,
  processConfiguration
};