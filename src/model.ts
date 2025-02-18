import { exists, tf } from "./deps.ts";
import { DetectionResult, ModelConfig } from "./types.ts";
import pino from "https://esm.sh/pino@8?dts";

// Create a Pino logger with a custom timestamp.
// The timestamp function returns a partial JSON string that will be merged into each log entry.
const logger = pino({
  timestamp: () => `,"timestamp":"${new Date().toLocaleString()}"`,
  // Remove default base fields (pid, hostname) if you prefer a cleaner output:
  base: null,
});

async function fetchModelFiles(config: ModelConfig): Promise<void> {
  // Convert relative path to absolute path for current working directory
  const modelPath = new URL(config.modelUrl, `file://${Deno.cwd()}/`).pathname;
  
  // Just verify the model files exist
  if (!await exists(modelPath)) {
    throw new Error('Model file not found. Please run the conversion script first.');
  }
  
  // Read model.json to verify weights files exist
  const modelContent = await Deno.readTextFile(modelPath);
  const modelJson = JSON.parse(modelContent);
  
  // Check weights files
  const modelDir = modelPath.split('/').slice(0, -1).join('/');
  for (const group of modelJson.weightsManifest) {
    for (const path of group.paths) {
      const weightsPath = `${modelDir}/${path}`;
      if (!await exists(weightsPath)) {
        throw new Error(`Weights file ${path} not found. Please run the conversion script first.`);
      }
    }
  }
}

async function loadModel(config: ModelConfig): Promise<tf.GraphModel> {
  try {
    await fetchModelFiles(config);
    
    // Convert relative path to absolute path
    const modelPath = new URL(config.modelUrl, `file://${Deno.cwd()}/`).pathname;
    
    // Read model.json
    const modelContent = await Deno.readTextFile(modelPath);
    const modelJson = JSON.parse(modelContent);
    
    // Get directory path
    const modelDir = modelPath.split('/').slice(0, -1).join('/');
    
    // Create array of File objects for model and all weight files
    const files = [
      new File([modelContent], 'model.json', { type: 'application/json' })
    ];
    
    // Add all weight files
    for (const group of modelJson.weightsManifest) {
      for (const path of group.paths) {
        const weightsPath = `${modelDir}/${path}`;
        const weightsContent = await Deno.readFile(weightsPath);
        files.push(new File([weightsContent], path, { type: 'application/octet-stream' }));
      }
    }
    
    // Create handler with all files
    const handler = tf.io.browserFiles(files);
    
    // Log the start of model loading using an emoji to indicate launch.
    logger.info("🚀 Loading model...");
    const model = await tf.loadGraphModel(handler);
    logger.info("✅ Model loaded successfully");
    logger.info({ inputShape: model.inputs[0].shape }, "Model Input Shape");
    
    return model;
  } catch (error) {
    logger.error("❌ Error loading model:", error);
    throw error;
  }
}

function preprocessAudio(audioChunk: Uint8Array, frameSize: number): tf.Tensor {
  // Create a DataView for easier manipulation of bytes
  const dataView = new DataView(audioChunk.buffer);

  // Calculate the number of 16-bit samples
  const numSamples = audioChunk.length / 2;

  // Create a Float32Array to store the normalized audio data
  const floatArray = new Float32Array(numSamples);

  // Iterate through the 16-bit samples
  for (let i = 0; i < numSamples; i++) {
    // Read the 16-bit integer (little-endian) using DataView
    const int16 = dataView.getInt16(i * 2, true); // true for little-endian
    // Normalize to [-1, 1]
    floatArray[i] = int16 / 32768.0;
  }

  // Ensure we have the correct frame size
  const paddedAudio = floatArray.length < frameSize
    ? new Float32Array(frameSize).fill(0).map((x, i) => i < floatArray.length ? floatArray[i] : 0)
    : floatArray.slice(0, frameSize);

  // Convert to spectrogram
  const frameLength = 2048;
  const frameStep = 512;
  const fft = tf.signal.stft(
    tf.tensor1d(paddedAudio),
    frameLength,
    frameStep,
    undefined,
    tf.signal.hammingWindow
  );
  console.log("FFT shape:", fft.shape);

  // Get magnitude spectrogram
  const magnitudes = tf.abs(fft);

  // Normalize and reshape for model input
  const normalized = tf.div(magnitudes, tf.max(magnitudes));
  return normalized.expandDims(0);
}

async function classifyAudio(
  model: tf.GraphModel,
  audioChunk: Uint8Array,
  config: ModelConfig
): Promise<DetectionResult> {
  try {
    const frameSize = Math.floor(config.sampleRate * config.frameDuration);
    const input = preprocessAudio(audioChunk, frameSize);

    // Log the input tensor shape
    console.log("Input tensor shape:", input.shape);

    const predictions = await model.predict(input) as tf.Tensor;
    const probabilities = await predictions.data();

    // Cleanup tensors
    input.dispose();
    predictions.dispose();

    // Get highest probability class
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const confidence = probabilities[maxIndex];
    const label = config.labels[maxIndex];

    return {
      isDetected: confidence > 0.7,
      confidence,
      label,
      isKnown: confidence > 0.5,
    };
  } catch (error) {
    logger.error("❌ Classification error:", error);
    return {
      isDetected: false,
      confidence: 0,
      label: "unknown",
      isKnown: false,
    };
  }
}

export { loadModel, classifyAudio };
