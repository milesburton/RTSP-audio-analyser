import * as tf from "https://esm.sh/@tensorflow/tfjs@4.17.0";
import "https://esm.sh/@tensorflow/tfjs-backend-cpu@4.17.0";
import { DetectionResult, ModelConfig } from "./types.ts";
import { loadConfig } from "./config.ts";
import logger, { 
  logAudioPreprocess, 
  logModelLoading, 
  logClassification, 
  logError 
} from "./pino-logger.ts";
import { getErrorMessage } from "./error-utils.ts";

async function loadModel(config: ModelConfig): Promise<tf.GraphModel> {
  // Try multiple possible paths for the model
  const possiblePaths = [
    config.modelUrl, // First try the path from config
    "../yamnet_conversion/yamnet_tfjs/model.json", // Fallback 1
    "../yamnet_conversion/yamnet_tfjs_reconverted/model.json", // Fallback 2
    "yamnet_conversion/yamnet_tfjs/model.json", // Fallback 3 (absolute path)
    "yamnet_conversion/yamnet_tfjs_reconverted/model.json" // Fallback 4 (absolute path)
  ];
  
  let lastError = null;
  
  // Try each path in order
  for (const path of possiblePaths) {
    try {
      const modelUrl = path.startsWith("http") 
        ? path 
        : new URL(path, import.meta.url).href;
        
      logModelLoading({ 
        modelUrl, 
        path, 
        msg: "Attempting to load model" 
      });
      
      const model = await tf.loadGraphModel(modelUrl);
      
      logger.info({ 
        inputShape: model.inputs[0].shape,
        inputDType: model.inputs[0].dtype,
        outputShape: model.outputs[0].shape,
        modelVersion: model.version,
        successPath: path
      }, "✅ Model loaded successfully");
      
      return model;
    } catch (error) {
      lastError = error;
      logger.warn(
        { 
          path, 
          errorMessage: getErrorMessage(error) 
        }, 
        "Failed to load model from path"
      );
    }
  }
  
  // If we get here, all paths failed
  logError("Model Loading", lastError);
  throw new Error(`Model loading failed: ${lastError}`);
}

async function classifyAudio(
  model: tf.GraphModel,
  audioChunk: Uint8Array,
  config: ModelConfig
): Promise<DetectionResult> {
  try {
    const appConfig = await loadConfig();
    
    // Check if we have enough audio data
    if (audioChunk.length < config.sampleRate * 0.5) {
      logAudioPreprocess({ 
        chunkSize: audioChunk.length, 
        msg: "Audio chunk too small, skipping" 
      });
      return {
        isDetected: false,
        confidence: 0,
        label: "insufficient_data",
        isKnown: false,
      };
    }

    // Preprocess audio
    const inputTensorData = preprocessAudio(audioChunk, config);
    if (inputTensorData.length === 0) {
      logger.warn("Preprocessed audio data is empty");
      return {
        isDetected: false,
        confidence: 0,
        label: "preprocessing_error",
        isKnown: false,
      };
    }

    // Create input tensor with the right shape
    const inputTensor = tf.tensor1d(inputTensorData);
    
    logAudioPreprocess({ 
      shape: inputTensor.shape,
      dtype: inputTensor.dtype,
      min: tf.min(inputTensor).dataSync()[0],
      max: tf.max(inputTensor).dataSync()[0],
      msg: "Created input tensor" 
    });

    // Execute model prediction
    let predictions;
    try {
      predictions = model.predict(inputTensor) as tf.Tensor;
      logger.debug("Model.predict succeeded");
    } catch (predictionError) {
      logger.error({ 
        error: predictionError,
        inputShape: inputTensor.shape,
        modelInputShape: model.inputs[0].shape
      }, "Error during model.predict");
      inputTensor.dispose();
      throw predictionError;
    }

    // YAMNet outputs a 2D tensor with shape [frames, num_classes]
    // We need to average probabilities across all frames
    let probabilityTensor;
    if (predictions.shape.length === 2) {
      probabilityTensor = predictions.mean(0);
    } else {
      probabilityTensor = predictions;
    }
    
    const probabilities = await probabilityTensor.data() as Float32Array;

    logger.debug({ 
      tensorShape: inputTensor.shape,
      predictionShape: predictions.shape,
      probabilitiesLength: probabilities.length,
      samplePredictions: probabilities.slice(0, 5)
    }, "Prediction details");

    // Clean up tensors
    inputTensor.dispose();
    predictions.dispose();
    if (probabilityTensor !== predictions) {
      probabilityTensor.dispose();
    }

    // Check for dimension mismatch
    if (probabilities.length !== config.labels.length) {
      logger.warn({
        probLength: probabilities.length,
        labelsLength: config.labels.length
      }, "Prediction dimensions don't match label count");
    }

    // Find the most likely class
    const maxIndex = findMaxIndex(probabilities);
    const confidence = probabilities[maxIndex];
    
    // Check if the index is within our labels array
    const label = maxIndex < config.labels.length 
      ? config.labels[maxIndex] 
      : `unknown_class_${maxIndex}`;

    // Use configurable thresholds
    const isDetected = confidence > appConfig.model.confidenceThreshold;
    const isKnown = confidence > appConfig.model.knownThreshold;

    // Log top detected classes
    const topClasses = getTopClasses(probabilities, config.labels, 3);
    logClassification({ 
      label, 
      confidence, 
      maxIndex,
      isDetected,
      isKnown,
      topClasses 
    });

    return {
      isDetected,
      confidence,
      label,
      isKnown,
    };
  } catch (error) {
    logError("Audio Classification", error);
    return {
      isDetected: false,
      confidence: 0,
      label: "error",
      isKnown: false,
    };
  }
}

function findMaxIndex(array: Float32Array): number {
  let maxIndex = 0;
  let maxValue = array[0];
  
  for (let i = 1; i < array.length; i++) {
    if (array[i] > maxValue) {
      maxValue = array[i];
      maxIndex = i;
    }
  }
  
  return maxIndex;
}

function preprocessAudio(
  audioChunk: Uint8Array,
  config: ModelConfig
): Float32Array {
  try {
    // Create a buffer view that references the same memory
    const buffer = audioChunk.buffer.slice(
      audioChunk.byteOffset,
      audioChunk.byteOffset + audioChunk.byteLength
    );
    
    // Create a DataView for the buffer
    const dataView = new DataView(buffer);
    const numSamples = Math.floor(audioChunk.length / 2); // 16-bit audio = 2 bytes per sample
    
    if (numSamples <= 0) {
      logger.warn("No audio samples to process");
      return new Float32Array(0);
    }
    
    logAudioPreprocess({ 
      numSamples, 
      bufferSize: buffer.byteLength, 
      msg: "Processing PCM samples" 
    });
    
    // Convert Int16 PCM to Float32 with proper range for YAMNet
    const floatArray = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      try {
        // Convert 16-bit PCM to float in range [-1, 1]
        const int16 = dataView.getInt16(i * 2, true); // true = little endian
        floatArray[i] = int16 / 32768.0; // Normalize to [-1, 1]
      } catch (e) {
        logger.error({ position: i, maxLength: dataView.byteLength }, "Error reading sample");
        // Fill remaining with zeros if we hit an error
        for (let j = i; j < numSamples; j++) {
          floatArray[j] = 0;
        }
        break;
      }
    }
    
    // Log the waveform characteristics
    if (floatArray.length > 0) {
      try {
        // Calculate basic signal properties
        let sum = 0;
        let max = -Infinity;
        let min = Infinity;
        
        for (let i = 0; i < floatArray.length; i++) {
          const val = floatArray[i];
          sum += val;
          if (val > max) max = val;
          if (val < min) min = val;
        }
        
        const mean = sum / floatArray.length;
        let variance = 0;
        
        for (let i = 0; i < floatArray.length; i++) {
          variance += Math.pow(floatArray[i] - mean, 2);
        }
        
        variance /= floatArray.length;
        const stdDev = Math.sqrt(variance);
        
        logAudioPreprocess({
          min, max, mean, 
          stdDev,
          zeroCrossings: countZeroCrossings(floatArray),
          samples: floatArray.length,
          msg: "Audio signal statistics"
        });
      } catch (statError) {
        logger.error({ error: statError }, "Error calculating signal statistics");
      }
    }

    // Calculate expected samples based on the frame duration
    const expectedSamples = Math.floor(config.sampleRate * config.frameDuration);
    
    logAudioPreprocess({
      actualSamples: floatArray.length,
      expectedSamples: expectedSamples, 
      duration: floatArray.length / config.sampleRate,
      msg: "Sample count comparison"
    });
    
    let result: Float32Array;

    // Handle different input sizes
    if (floatArray.length < expectedSamples) {
      // Zero-pad if we have fewer samples than needed
      result = new Float32Array(expectedSamples);
      result.set(floatArray);
      logAudioPreprocess({
        original: floatArray.length,
        padded: result.length,
        durationS: result.length / config.sampleRate,
        msg: "Zero-padded audio data"
      });
    } else if (floatArray.length > expectedSamples) {
      // Truncate if we have more samples than needed
      result = floatArray.slice(0, expectedSamples);
      logAudioPreprocess({
        original: floatArray.length,
        truncated: result.length,
        durationS: result.length / config.sampleRate,
        msg: "Truncated audio data"
      });
    } else {
      result = floatArray;
      logAudioPreprocess({ 
        samples: floatArray.length,
        durationS: floatArray.length / config.sampleRate,
        msg: "Audio data already at target size"
      });
    }

    return result;
  } catch (error) {
    logError("Audio Preprocessing", error);
    return new Float32Array(0);
  }
}

function countZeroCrossings(signal: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < signal.length; i++) {
    if ((signal[i] >= 0 && signal[i-1] < 0) || 
        (signal[i] < 0 && signal[i-1] >= 0)) {
      crossings++;
    }
  }
  return crossings;
}

function getTopClasses(
  probabilities: Float32Array, 
  labels: string[], 
  n: number
): Array<{label: string, confidence: number}> {
  // Create array of index, probability pairs
  const indexed = Array.from(probabilities).map((prob, index) => ({index, prob}));
  
  // Sort by probability (descending)
  indexed.sort((a, b) => b.prob - a.prob);
  
  // Return top N classes with labels
  return indexed
    .slice(0, n)
    .map(item => ({
      label: item.index < labels.length ? labels[item.index] : `unknown_class_${item.index}`,
      confidence: item.prob
    }));
}

export { loadModel, classifyAudio };