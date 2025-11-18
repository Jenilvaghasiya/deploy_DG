import torch
from PIL import Image
import numpy as np
from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet

# Load image
img = Image.open("/home/dgflask/BetaTestDesignGenieJs/DesignGenieJS/backend/src/image_enhancer/img.png").convert("RGB")


# Define model
model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)

# Initialize upsampler
upsampler = RealESRGANer(
    scale=4,
    model_path="/home/dgflask/BetaTestDesignGenieJs/DesignGenieJS/backend/src/image_enhancer/RealESRGAN_x4plus.pth",
    model=model,
    tile=0,
    tile_pad=10,
    pre_pad=0,
    half=False
)

# Run inference
img_np = np.array(img)
output, _ = upsampler.enhance(img_np, outscale=4)

# Save output
Image.fromarray(output).save("/home/dgflask/BetaTestDesignGenieJs/DesignGenieJS/backend/src/image_enhancer/output_hd3.png")
print("Upscaled image saved!")