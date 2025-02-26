export { load } from "https://deno.land/std@0.217.0/dotenv/mod.ts";
export { exists } from "https://deno.land/std@0.217.0/fs/exists.ts";
export type { Logger } from "https://esm.sh/pino@8.15.6?bundle";

// Zod validation library
export { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// TensorFlow.js imports
import * as tf from "https://esm.sh/@tensorflow/tfjs@4.17.0";
export { tf };

// TensorFlow backends and converters
import "https://esm.sh/@tensorflow/tfjs-backend-cpu@4.17.0";
import "https://esm.sh/@tensorflow/tfjs-converter@4.17.0";

// Export specific TensorFlow utilities
export {
  setBackend,
  ready as tfReady,
} from "https://esm.sh/@tensorflow/tfjs@4.17.0";

// Export TensorFlow types
export type {
  DataType,
  Rank,
  TensorLike,
  Tensor,
} from "https://esm.sh/@tensorflow/tfjs-core@4.17.0";

// Logging imports
export { default as pino } from "https://esm.sh/pino@8.15.6?bundle";
export { default as pinoPretty } from "https://esm.sh/pino-pretty@10.2.0?bundle";