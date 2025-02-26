# Audio Event Detector - Logging System

## Overview

The Audio Event Detector uses a comprehensive logging system to provide clear, visual information about the application's operation. All logging is centralized through the `pino-logger.ts` module to ensure consistent formatting and behavior.

## Log Levels

The application supports the following log levels (in order of verbosity):

1. **TRACE** - Very detailed information, useful only for deep debugging
2. **DEBUG** - Detailed information about internal processes
3. **INFO** - General operational information (default)
4. **WARN** - Potential issues that don't prevent operation
5. **ERROR** - Issues that might impact functionality
6. **FATAL** - Critical errors that prevent the application from functioning

## Setting the Log Level

In this Deno application, the log level is configured through the `.env` file. Create a `.env` file in the root directory of the project with the following content:

```
# .env file
LOG_LEVEL=info    # Default: Use for normal operation
# Other options: debug, trace, warn, error, fatal
```

You can also use the provided `.env.template` as a starting point:

```bash
# Copy the template to create your .env file
cp .env.template .env

# Edit the file to set your log level
nano .env
```

## Visual Elements

### Emojis

The logging system uses emojis to help quickly identify different types of log messages:

- 🚀 - Startup/initialization
- ✅ - Success
- ℹ️ - Information
- 🔍 - Debug details
- ⚠️ - Warnings
- 🚨 - Errors
- 💥 - Fatal errors
- 🎵 - Audio processing
- 🎯 - Event detection
- 📊 - Statistics

### Boxed Messages

For important information, the system uses boxed messages that stand out in the console:

```
╔════════════════════════════════════╗
║ ❌ ERROR                           ║
║                                    ║
║ Failed to load the YAMNet model.   ║
║ Please check the model path.       ║
╚════════════════════════════════════╝
```

These are used for:
- Application startup
- Critical errors
- Important notifications
- Success confirmations

## Log File

In addition to console output, the application maintains a detection log at `logs/detections.log`. This log specifically records sound events that were detected with high confidence.

## Debug Mode

When running with `LOG_LEVEL=debug`, you'll see additional information that can help with troubleshooting:

- Audio preprocessing details
- Model loading attempts
- TensorFlow operations
- FFmpeg output
- Detailed classification results

## Viewing Only Important Logs

If you're not interested in the detailed logs, you can use the default `INFO` level, which will only show you essential information about the application's operation.

## Using the Logging System in Code

### Importing the Logger

Following Deno's best practices, all dependencies are centralized in the `deps.ts` file. The logging system is built on top of Pino, which is imported from `deps.ts`.

To use the logger in your code:

```typescript
// Import the logger
import logger from "./pino-logger.ts";

// Use the logger with different log levels
logger.info("This is an information message");
logger.debug("This is a debug message");
logger.warn("This is a warning message");
logger.error("This is an error message");
```

### Using Boxed Messages

For important notifications, you can use the boxed logging:

```typescript
import { logSuccess, logError, logInfo } from "./boxen-logger.ts";

// Log a success message in a box
logSuccess("Operation completed successfully!");

// Log an error message in a box
logError("Failed to connect to the database", "CONNECTION ERROR");

// Log an information message in a box
logInfo("System is ready and waiting for input");
```

### Custom Logging Functions

The logging system provides specialized functions for common use cases:

```typescript
import { logModelLoading, logAudioPreprocess, logClassification } from "./pino-logger.ts";

// Log model loading details
logModelLoading({ modelUrl: "path/to/model.json" });

// Log audio preprocessing information
logAudioPreprocess({ 
  numSamples: 16000, 
  duration: 1.0, 
  msg: "Processing PCM samples" 
});

// Log classification results
logClassification({
  label: "Dog",
  confidence: 0.85,
  topClasses: [
    { label: "Dog", confidence: 0.85 },
    { label: "Wolf", confidence: 0.12 },
    { label: "Coyote", confidence: 0.03 }
  ]
});
```

## Log Messages for Common Issues

### Missing RTSP Stream

```
╔═════════════════════════════════════════════╗
║ ❌ CONFIGURATION ERROR                      ║
║                                             ║
║ RTSP stream URL is not defined in           ║
║ configuration.                              ║
║ Please set RTSP_STREAM in your .env file.   ║
╚═════════════════════════════════════════════╝
```

### Model Loading Failure

```
╔═════════════════════════════════════════════╗
║ ❌ MODEL LOADING FAILED                     ║
║                                             ║
║ Failed to load the YAMNet model from any    ║
║ location.                                   ║
║ Last error: SyntaxError: Unexpected token   ║
╚═════════════════════════════════════════════╝
```

### Sound Detection

```
🐕 Sound detected: Dog (87.5%)
```

## Configuration Reference

| Environment Variable | Description | Default Value | Options |
|---------------------|-------------|---------------|---------|
| `LOG_LEVEL` | Controls the verbosity of logs | `info` | `trace`, `debug`, `info`, `warn`, `error`, `fatal` |
| `RTSP_STREAM` | The RTSP stream URL to process | None (required) | Any valid RTSP URL |
| `CONFIDENCE_THRESHOLD` | Threshold for detection confidence | `0.5` | Float between 0.0 and 1.0 |

## Log File Rotation

The application doesn't currently implement log rotation. For long-running deployments, it's recommended to set up external log rotation for the `logs/detections.log` file.

## Reading the Logs

Logs are formatted to be human-readable with timestamps, log levels, and descriptive messages. When troubleshooting, pay attention to warning and error messages, which often provide specific information about what went wrong.

Example:
```
2025-02-26T15:30:45.123Z INFO  ✅ Model loaded successfully
2025-02-26T15:30:46.456Z INFO  🎬 Starting FFmpeg process for audio extraction
2025-02-26T15:30:47.789Z INFO  🐕 Sound detected: Dog (87.5%)
```

The timestamps are in ISO format with UTC timezone, making it easier to correlate events across different systems.