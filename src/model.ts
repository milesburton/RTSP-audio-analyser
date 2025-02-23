// model.ts (Loading Reconverteed TFJS Model)

import * as tf from "https://esm.sh/@tensorflow/tfjs@4.17.0";
import "https://esm.sh/@tensorflow/tfjs-backend-cpu@4.17.0";
import { DetectionResult, ModelConfig } from "./types.ts";
import pino from "https://esm.sh/pino@8?dts";

const logger = pino({
  timestamp: () => `,"timestamp":"${new Date().toLocaleString()}"`,
  base: null,
});

async function loadModel(): Promise<tf.GraphModel> {
  const modelUrl = new URL(
    "../yamnet_conversion/yamnet_tfjs_reconverted/model.json",
    import.meta.url
  ).href;
  logger.info({ modelUrl }, "🚀 Loading TensorFlow.js model...");
  const model = await tf.loadGraphModel(modelUrl); // Load directly from URL
  logger.info({ inputShape: model.inputs[0].shape }, "Model Input Shape");
  return model;
}

// ... (rest of your model.ts - classifyAudio and preprocessAudio remain the same) ...

async function classifyAudio(
  model: tf.GraphModel,
  audioChunk: Uint8Array,
  config: ModelConfig
): Promise<DetectionResult> {
  try {
    const inputTensorData = preprocessAudio(audioChunk, config);
    const inputTensor = tf.tensor(inputTensorData, [1, inputTensorData.length]);

    const predictions = (await model.predict(inputTensor)) as tf.Tensor;
    const probabilities = (await predictions.data()) as Float32Array;

    inputTensor.dispose();
    predictions.dispose();

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
    logger.error({ error }, "❌ Classification error");
    return {
      isDetected: false,
      confidence: 0,
      label: "unknown",
      isKnown: false,
    };
  }
}

function preprocessAudio(
  audioChunk: Uint8Array,
  config: ModelConfig
): Float32Array {
  const dataView = new DataView(audioChunk.buffer);
  const numSamples = audioChunk.length / 2;
  const floatArray = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    floatArray[i] = int16 / 32768.0;
  }

  const expectedSamples = config.sampleRate * 0.975;
  let result: Float32Array;

  if (floatArray.length < expectedSamples) {
    result = new Float32Array(expectedSamples);
    result.set(floatArray);
  } else if (floatArray.length > expectedSamples) {
    result = floatArray.slice(0, expectedSamples);
  } else {
    result = floatArray;
  }
  return result;
}

export { loadModel, classifyAudio };