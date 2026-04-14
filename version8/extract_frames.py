import cv2
import os

video_path = "c:/Users/user/Desktop/projects/Seng430/v2/public/bg-animation.mp4"
output_dir = "c:/Users/user/Desktop/projects/Seng430/v2/public/bg-frames"

os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)

print(f"Total frames: {frame_count}, FPS: {fps}")

count = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # Resize to something reasonable for a background if it's too large, say 720p or 1080p width
    height, width = frame.shape[:2]
    if width > 1280:
        scale = 1280 / width
        frame = cv2.resize(frame, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)

    # Save as JPEG with high compression (smaller file size, perfect for fast web canvas drawing)
    frame_path = os.path.join(output_dir, f"frame_{count:04d}.jpg")
    cv2.imwrite(frame_path, frame, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
    count += 1

cap.release()
print(f"Extracted {count} frames successfully.")
