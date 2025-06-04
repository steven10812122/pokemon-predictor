from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import io
import os
import traceback

app = Flask(__name__)
CORS(app)
import sys
print("Python executable:", sys.executable)
print("sys.path:", sys.path)


# 設定模型相關路徑
MODEL_PATH = 'model/best_model.pth'
LABEL_PATH = 'model/class_labels.npy'

# 設定裝置
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"使用設備: {device}")

# 預處理轉換
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                       std=[0.229, 0.224, 0.225])
])

# 載入模型和標籤
def load_model():
    try:
        print(f"正在載入標籤從: {os.path.abspath(LABEL_PATH)}")
        class_labels = np.load(LABEL_PATH, allow_pickle=True)
        print(f"成功載入 {len(class_labels)} 個標籤")
        
        print(f"正在載入模型從: {os.path.abspath(MODEL_PATH)}")
        num_classes = len(class_labels)
        model = models.resnet50(pretrained=False)
        model.fc = nn.Sequential(
        nn.Linear(model.fc.in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, num_classes)
            )
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))

        model.eval()
        model.to(device)
        print("模型載入成功")
        return model, class_labels
    except Exception as e:
        print(f"載入模型時發生錯誤: {str(e)}")
        traceback.print_exc()
        raise

# 預測函數
def predict_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        print(f"圖片載入成功，大小: {image.size}")
        
        input_tensor = transform(image).unsqueeze(0).to(device)
        print("圖片預處理完成")
        
        with torch.no_grad():
            output = model(input_tensor)
            pred_idx = torch.argmax(output, dim=1).item()
            
        result = {
            'predicted_index': int(pred_idx),
            'predicted_label': class_labels[pred_idx]
        }
        print(f"預測結果: {result}")
        return result
    except Exception as e:
        print(f"預測過程中發生錯誤: {str(e)}")
        traceback.print_exc()
        raise

print("正在初始化...")
# 載入模型和標籤（全域變數）
model, class_labels = load_model()
print("初始化完成！")

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': '沒有上傳圖片'}), 400
    
    file = request.files['image']
    img_bytes = file.read()
    
    try:
        result = predict_image(img_bytes)
        return jsonify(result)
    except Exception as e:
        error_msg = f"預測失敗: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return jsonify({'error': error_msg}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 