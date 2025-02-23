import tensorflow as tf
import tensorflowjs as tfjs
import os

def reconvert_to_tfjs(saved_model_path, tfjs_output_path):
    """
    Loads a SavedModel, converts it to TFJS format using the command-line
    tool, and saves it.
    """
    try:
        # Load the SavedModel.
        model = tf.saved_model.load(saved_model_path)

        # Construct the command for tensorflowjs_converter.
        command = [
            "tensorflowjs_converter",
            "--input_format=tf_saved_model",
            "--output_format=tfjs_graph_model",
            "--signature_name=serving_default", # Important!
            "--saved_model_tags=serve",       # Important!
            saved_model_path,
            tfjs_output_path,
        ]

        # Execute the command.
        print(f"Running command: {' '.join(command)}")
        os.system(" ".join(command))  # Use os.system for simplicity

        print(f"✅ TFJS model (reconverted) saved to: {tfjs_output_path}")

    except Exception as e:
        print(f"❌ Error during reconversion: {e}")
        raise  # Re-raise the exception

if __name__ == "__main__":
    SAVED_MODEL_PATH = "./yamnet_conversion/yamnet_tf"
    TFJS_OUTPUT_PATH = "./yamnet_conversion/yamnet_tfjs_reconverted"
    os.makedirs(TFJS_OUTPUT_PATH, exist_ok=True) # Ensure output dir exists

    reconvert_to_tfjs(SAVED_MODEL_PATH, TFJS_OUTPUT_PATH)
