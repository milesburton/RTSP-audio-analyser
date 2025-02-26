import tensorflow as tf
import tensorflow_hub as hub
import json
import os

def extract_weight_specs(model_url, output_json_path):
    """
    Extracts weight specifications from a TensorFlow Hub model and saves them
    to a JSON file.

    Args:
        model_url: URL of the TensorFlow Hub model.
        output_json_path: Path to save the JSON file.
    """
    try:
        # Load the model from TensorFlow Hub using hub.KerasLayer.
        yamnet_model = hub.KerasLayer(model_url, trainable=False) # Set trainable=False

        weight_specs = []
        # Iterate through yamnet_model.variables (or .trainable_variables).
        for variable in yamnet_model.variables:  # Use .variables here
            weight_specs.append({
                "name": variable.name,
                "shape": variable.shape.as_list(),
                "dtype": variable.dtype.name,
            })

        # Save the weight specs to a JSON file.
        with open(output_json_path, "w") as f:
            json.dump(weight_specs, f, indent=4)

        print(f"✅ Weight specs saved to: {output_json_path}")

    except Exception as e:
        print(f"❌ Error during extraction: {e}")

if __name__ == "__main__":
    MODEL_URL = "https://tfhub.dev/google/yamnet/1"  # YAMNet model URL
    OUTPUT_JSON_PATH = "./yamnet_conversion/yamnet_tf/weight_specs.json"

    extract_weight_specs(MODEL_URL, OUTPUT_JSON_PATH)