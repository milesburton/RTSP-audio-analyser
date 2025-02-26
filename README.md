# 🎧 Deno Audio Event Detector

⚠️ Experimental - Work in Progress

🐕 A clever audio detection system built with Deno, TypeScript, and TensorFlow.js. Whilst initially designed for detecting dog barks, this flexible system can be extended to detect various audio events such as bird calls 🐦 or other sounds.

This project leverages remote imports for hassle-free dependency management and utilises FFmpeg to process RTSP streams, logging detection events with precise timestamps.

## ✨ Features

- 📹 **RTSP Stream Processing:**  
  Seamlessly captures audio from CCTV cameras using FFmpeg.
  
- 🔍 **Generic Audio Event Detection:**  
  Utilises TensorFlow.js for audio event detection, currently configured for dog bark detection using threshold-based analysis.
  
- 📝 **Event Logging:**  
  Automatically logs detections with timestamps to `logs/detections.log`.

- 🐳 **Dev Container:**  
  Includes VS Code dev container configuration for a consistent development experience.

- 💾 **Named Volume:**  
  Implements Docker named volume (`detections_volume`) for persistent log storage between container restarts.

- 🔄 **Remote Imports:**  
  Simplifies dependency management with remote imports.

## 🔧 Prerequisites

- 🐳 [Docker](https://www.docker.com/get-started)
- 💻 [VS Code](https://code.visualstudio.com/) (for dev container usage)
- 🎥 [FFmpeg](https://ffmpeg.org/) (required in container or host)

## 🚀 Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/deno-audio-event-detector.git
   cd deno-audio-event-detector
   ```

## ▶️ Running the Script

You can run the script in two ways:

### 1. Using Docker (Recommended)
```bash
# Build and run the container
docker compose up --build

# To run in detached mode
docker compose up -d
```

### 2. Direct Execution
If you have Deno installed locally, you can run the script directly:
```bash
deno run --allow-env --allow-run --allow-net --allow-read --allow-write src/app.ts
```

### Required Permissions Explained:
- `--allow-env`: Access environment variables
- `--allow-run`: Execute FFmpeg commands
- `--allow-net`: Process RTSP streams
- `--allow-read`: Read configuration files
- `--allow-write`: Write to log files

### 📊 Monitoring
- Check the logs folder for detection events: `logs/detections.log`
- View real-time console output for debugging information
- Monitor Docker container status with `docker ps` if running in container mode