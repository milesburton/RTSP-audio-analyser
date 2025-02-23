// deps.ts
export { load } from "https://deno.land/std@0.217.0/dotenv/mod.ts";
export { exists } from "https://deno.land/std@0.217.0/fs/exists.ts";
import * as tf from "https://esm.sh/@tensorflow/tfjs@4.17.0";
export { tf };
import "https://esm.sh/@tensorflow/tfjs-backend-cpu@4.17.0";
import "https://esm.sh/@tensorflow/tfjs-converter@4.17.0";
export {
  setBackend,
  ready as tfReady,
} from "https://esm.sh/@tensorflow/tfjs@4.17.0";

export type {
  DataType,
  Rank,
  TensorLike,
  Tensor,
} from "https://esm.sh/@tensorflow/tfjs-core@4.17.0";