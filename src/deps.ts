
// Deno standard library dependencies
export { load } from "https://deno.land/std@0.217.0/dotenv/mod.ts";

// TensorFlow.js dependencies
import * as tf from "https://esm.sh/@tensorflow/tfjs-core@4.17.0";
export { tf };  // Re-export the entire namespace

// Optional: If you need the WebGL backend
export { 
  setBackend,
  ready as tfReady 
} from "https://esm.sh/@tensorflow/tfjs@4.17.0";

// Types
export type { 
  DataType,
  Rank,
  TensorLike 
} from "https://esm.sh/@tensorflow/tfjs-core@4.17.0";

// Testing dependencies (if needed)
export { 
  assertEquals,
  assertExists 
} from "https://deno.land/std@0.217.0/assert/mod.ts";