import { Writable } from "node:stream"; 

const nodeStdout = new Writable({
  write(chunk, _encoding, callback) {
    // Write the chunk to Deno.stdout
    Deno.stdout.write(chunk)
      .then(() => callback()) // Success: call the callback
      .catch(callback); // Error: pass the error to the callback
  },
  final(callback) {
    // Optional: Implement any cleanup logic here
    callback();
  },
});

export default nodeStdout;