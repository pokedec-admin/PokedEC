#!/usr/bin/env python3
from PIL import Image
import sys

def make_background_transparent(input_path, output_path, threshold=240):
    """
    Convert white/light background to transparent
    """
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # Change all white (also shades of whites)
        # to transparent
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"✅ Transparent logo created: {output_path}")

if __name__ == "__main__":
    input_file = "frontend/src/app/pages/home/Logo_Pokedec.png"
    output_file = "frontend/public/Logo_Pokedec.png"
    
    try:
        make_background_transparent(input_file, output_file)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
