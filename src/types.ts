export interface EnvConfig {
  RTSP_STREAM: string;
}

export interface ModelConfig {
  modelUrl: string;
  labels: string[];
  sampleRate: number;
  frameDuration: number;
}

export interface DetectionResult {
  isDetected: boolean;
  confidence: number;
  label: string;
  isKnown: boolean;
}