export interface EnvConfig {
  RTSP_STREAM?: string;
  LOG_LEVEL?: string;
  MODEL_PATH?: string;
  CONFIDENCE_THRESHOLD?: string;
  SAMPLE_RATE?: string;
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


export interface AudioFrame {
  data: Float32Array;
  timestamp: number;
  sampleRate: number;
}

export interface DetectionEvent {
  label: string;
  confidence: number;
  timestamp: number;
  isKnown: boolean;
}

export interface SoundClassification {
  label: string;
  confidence: number;
  className?: string;
  categoryId?: number;
}