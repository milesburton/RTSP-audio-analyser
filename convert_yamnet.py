import tensorflow as tf
import tensorflow_hub as hub
import tensorflowjs as tfjs
import os

# Create the yamnet_conversion directory and its subdirectories
base_dir = 'yamnet_conversion'
os.makedirs(base_dir, exist_ok=True)
os.makedirs(f'{base_dir}/yamnet_tf', exist_ok=True)
os.makedirs(f'{base_dir}/yamnet_tfjs', exist_ok=True)

# Download the model from TF Hub
print("Downloading YAMNet model...")
yamnet_model = hub.load('https://tfhub.dev/google/yamnet/1')

# Create a wrapper model with the correct signature
class YAMNetWrapper(tf.keras.Model):
    def __init__(self, yamnet):
        super(YAMNetWrapper, self).__init__()
        self.yamnet = yamnet

    @tf.function(input_signature=[tf.TensorSpec(shape=[None], dtype=tf.float32)])
    def call(self, waveform):
        scores, embeddings, specs = self.yamnet(waveform)
        return scores

# Create and save the wrapped model
print("Creating wrapped model...")
wrapped_model = YAMNetWrapper(yamnet_model)

# Save with the correct signature
print("Saving model in SavedModel format...")
tf.saved_model.save(
    wrapped_model,
    f'{base_dir}/yamnet_tf',
    signatures=wrapped_model.call
)

# Load the SavedModel and inspect signatures
print("Loading SavedModel and inspecting signatures...")
loaded = tf.saved_model.load(f'{base_dir}/yamnet_tf')
print(f"Signatures: {loaded.signatures}")

# Convert to TFJS format
print("Converting to TFJS format...")
tfjs.converters.convert_tf_saved_model(
    f'{base_dir}/yamnet_tf',
    f'{base_dir}/yamnet_tfjs'
)

print("Conversion complete! Model is in the yamnet_conversion/yamnet_tfjs directory")