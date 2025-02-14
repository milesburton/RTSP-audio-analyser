# Deno Audio Event Detector

This project is a generic audio event detector built with Deno, TypeScript, and TensorFlow.js. While the focus of the application is to detect dog barks, the design is generic enough to be extended for detecting other audio events (e.g., bird calls).

This project uses remote imports so that you don't have to manage dependencies locally. It processes an RTSP stream using FFmpeg and logs detection events with timestamps.

## Features

- **RTSP Stream Processing:**  
  Captures audio from a CCTV camera using FFmpeg.
  
- **Generic Audio Event Detection:**  
  Uses a dummy TensorFlow.js-based function to detect audio events. Currently, it “detects” dog barks when the audio meets a simple threshold condition.
  
- **Event Logging:**  
  Logs detections with timestamps to `logs/detections.log`.

- **Dev Container:**  
  Includes a VS Code dev container configuration for an easy development environment.

- **Named Volume:**  
  Uses a Docker named volume (`detections_volume`) to persist the logs between container restarts.

- **Remote Imports:**  
  All dependencies are imported remotely.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [VS Code](https://code.visualstudio.com/) (if using the dev container)
- [FFmpeg](https://ffmpeg.org/) (must be available in the container or on your host)

## Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/deno-audio-event-detector.git
   cd deno-audio-event-detector

# RTSP-audio-analyser
