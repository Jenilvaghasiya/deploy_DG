import sys
import base64
import io
from PIL import Image
import numpy as np
from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet
import json
import contextlib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "RealESRGAN_x4plus.pth")

@contextlib.contextmanager
def suppress_stdout():
    with open(os.devnull, "w") as devnull:
        old_stdout = sys.stdout
        sys.stdout = devnull
        try:
            yield
        finally:
            sys.stdout = old_stdout

def upscale_base64(input_base64):
    try:
        img_data = base64.b64decode(input_base64)
        img = Image.open(io.BytesIO(img_data))
        if img.mode != "RGB":
            img = img.convert("RGB")

        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        upsampler = RealESRGANer(scale=4, model_path=MODEL_PATH, model=model, tile=64, tile_pad=10, pre_pad=0, half=False, device="cpu")

        img_np = np.array(img)
        with suppress_stdout():
            output, _ = upsampler.enhance(img_np, outscale=4)

        buffer = io.BytesIO()
        Image.fromarray(output).save(buffer, format="PNG")
        out_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return json.dumps({"success": True, "data": f"data:image/png;base64,{out_base64}"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

if __name__ == "__main__":
    input_base64 = sys.stdin.read()  # read from stdin
    print(upscale_base64(input_base64))
