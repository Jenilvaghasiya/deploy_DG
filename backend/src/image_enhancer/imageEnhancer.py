import os
import io
import sys
import json
import base64
import warnings
import contextlib
from PIL import Image
import numpy as np
from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet

# suppress warnings
warnings.filterwarnings("ignore", category=UserWarning)

MODEL_PATH = "/home/dgflask/BetaTestDesignGenieJs/DesignGenieJS/backend/src/image_enhancer/RealESRGAN_x4plus.pth"

@contextlib.contextmanager
def suppress_stdout():
    with open(os.devnull, "w") as devnull:
        old_stdout = sys.stdout
        sys.stdout = devnull
        try:
            yield
        finally:
            sys.stdout = old_stdout

def upscale_base64_to_base64(input_base64):
    try:
        img_bytes = base64.b64decode(input_base64)
        img = Image.open(io.BytesIO(img_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Optional downscale
        max_size = 2048
        if max(img.size) > max_size:
            img.thumbnail((max_size, max_size), Image.ANTIALIAS)

        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)

        upsampler = RealESRGANer(scale=4, model_path=MODEL_PATH, model=model,
                                 tile=64, tile_pad=10, pre_pad=0, half=False, device="cpu")

        img_np = np.array(img)
        with suppress_stdout():
            output, _ = upsampler.enhance(img_np, outscale=4)

        buffer = io.BytesIO()
        Image.fromarray(output).save(buffer, format="PNG")
        result_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return json.dumps({"success": True, "data": f"data:image/png;base64,{result_base64}"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

if __name__ == "__main__":
    # read base64 from stdin
    input_base64 = sys.stdin.read()
    result = upscale_base64_to_base64(input_base64)
    print(result)
