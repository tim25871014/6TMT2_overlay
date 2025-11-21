from PIL import Image, ImageOps, ImageDraw
import os

def resize_images_with_rounded_corners(input_folder, output_folder, size=(70, 70), corner_radius=5):

    os.makedirs(output_folder, exist_ok=True)
    
    for file_name in os.listdir(input_folder):
        file_path = os.path.join(input_folder, file_name)
        
        if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
            try:
                with Image.open(file_path) as img:
                    img = img.convert("RGBA")
                    img.thumbnail(size, Image.LANCZOS)
                    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
                    x_offset = (size[0] - img.width) // 2
                    y_offset = (size[1] - img.height) // 2
                    canvas.paste(img, (x_offset, y_offset))
                    mask = Image.new("L", size, 0)
                    draw = ImageDraw.Draw(mask)
                    draw.rounded_rectangle(
                        (0, 0, size[0], size[1]), 
                        radius=corner_radius, 
                        fill=255
                    )
                    canvas.putalpha(mask)
                    
                    output_path = os.path.join(output_folder, file_name)
                    canvas.save(output_path, "PNG")
                    print(f"成功處理圖片: {file_name}")
            except Exception as e:
                print(f"處理圖片 {file_name} 時發生錯誤: {e}")

# 設定資料夾路徑
input_folder = "raw_avatars"  # 替換為你的圖片來源資料夾路徑
output_folder = "flags"  # 替換為你想保存的圖片資料夾路徑

resize_images_with_rounded_corners(input_folder, output_folder)
