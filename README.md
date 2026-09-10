# Pokemon Predictor

上傳一張寶可夢圖片，用 ResNet-50 模型辨識是哪一隻寶可夢。

**Demo: https://steven10812122.github.io/pokemon-predictor/**

## 架構

- `backend/` — 訓練模型用的 PyTorch 程式碼與原始權重（`best_model.pth`），僅供本地訓練/推論參考，網站不會用到。
- `docs/` — GitHub Pages 網站本體。純靜態頁面（HTML/CSS/JS），透過 [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/) 在瀏覽器裡直接跑模型推論，圖片不會上傳到任何伺服器，也不需要架設後端。
  - `docs/model/pokemon_resnet50_int8.onnx` 是從 `best_model.pth` 匯出並做 int8 動態量化後的版本（100MB → 25MB），方便瀏覽器下載與推論。

## 為什麼原本的前端沒有成功

原本的 `frontend/`（React + Flask）把預測請求寫死打 `http://localhost:5000/predict`，也就是必須自己在本機跑 Flask 後端才能用，沒辦法變成一個大家都能打開的公開網站。現在改成模型直接在瀏覽器端用 WebAssembly 執行，整個網站是純靜態檔案，部署在 GitHub Pages 就能公開分享，不用再處理後端部署或跨網域問題。

## 本機開發

```bash
cd docs
python3 -m http.server 8000
# 打開 http://localhost:8000
```

## 重新匯出 / 量化模型

如果重新訓練了模型，需要重新產生 `docs/model/pokemon_resnet50_int8.onnx`：

```bash
pip install torch torchvision onnx onnxruntime
python - <<'EOF'
# 1. 用 backend/app.py 裡一樣的架構 load_state_dict(best_model.pth)
# 2. torch.onnx.export(model, dummy_input, "pokemon_resnet50.onnx", dynamo=False, ...)
# 3. onnxruntime.quantization.quantize_dynamic(...) 產生 int8 版本
# 4. 複製到 docs/model/，並把 class_labels.npy 轉成 docs/model/class_labels.json
EOF
```
