# Before this file is executed you'll need to download
# and extract a valid vits coqui-tts model please check
# their config file for the location of these models.

from TTS.tts.models.vits import Vits
from TTS.tts.configs.vits_config import VitsConfig

config = VitsConfig()

# Download some known configuration to this directory based on
# avaliable models that are in coqui TTS.
config.load_json("./tts_models--en--ljspeech--vits/config.json")

# Initialize VITS model and load its checkpoint
vits = Vits.init_from_config(config)

# Load a particular models checkpoint pth file.
vits.load_checkpoint(config, "./tts_models--en--ljspeech--vits/model_file.pth")

# Export the model in a format that can be consumed by onnx.
vits.export_onnx(output_path='../model/vits.onnx', verbose=False)