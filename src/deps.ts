// Deno standard library dependencies
export { load } from "https://deno.land/std@0.217.0/dotenv/mod.ts";
export { exists } from "https://deno.land/std@0.217.0/fs/exists.ts";

// TensorFlow.js dependencies - importing the full package instead of just core
import * as tf from "https://esm.sh/@tensorflow/tfjs@4.17.0";
export { tf };  // Re-export the entire namespace

import "https://esm.sh/@tensorflow/tfjs-backend-cpu@4.17.0";
import "https://esm.sh/@tensorflow/tfjs-converter@4.17.0";

// TensorFlow.js backend and utilities
export {
  setBackend,
  ready as tfReady
} from "https://esm.sh/@tensorflow/tfjs@4.17.0";

// TensorFlow.js types
export type {
  DataType,
  Rank,
  TensorLike,
  Tensor
} from "https://esm.sh/@tensorflow/tfjs-core@4.17.0";