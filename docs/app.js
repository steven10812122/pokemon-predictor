const MODEL_URL = "model/pokemon_resnet50_int8.onnx";
const LABELS_URL = "model/class_labels.json";
const POKEMON_LIST_URL = "pokemon_full_list.json";
const IMAGE_SIZE = 224;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

const TYPE_COLORS = {
  一般: "#A8A878",
  火: "#F08030",
  水: "#6890F0",
  電: "#F8D030",
  草: "#78C850",
  冰: "#98D8D8",
  格鬥: "#C03028",
  毒: "#A040A0",
  地面: "#E0C068",
  飛行: "#A890F0",
  超能力: "#F85888",
  蟲: "#A8B820",
  岩石: "#B8A038",
  幽靈: "#705898",
  龍: "#7038F8",
  惡: "#705848",
  鋼: "#B8B8D0",
  妖精: "#EE99AC",
};

ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/";

const fileInput = document.getElementById("file-input");
const pickBtn = document.getElementById("pick-btn");
const predictBtn = document.getElementById("predict-btn");
const previewWrap = document.getElementById("preview-wrap");
const previewImg = document.getElementById("preview-img");
const statusEl = document.getElementById("status");
const statusText = document.getElementById("status-text");
const errorBox = document.getElementById("error-box");
const resultCard = document.getElementById("result-card");
const resultZh = document.getElementById("result-zh");
const resultEn = document.getElementById("result-en");
const resultMeta = document.getElementById("result-meta");
const resultTypes = document.getElementById("result-types");
const resultConfidence = document.getElementById("result-confidence");

let session = null;
let classLabels = [];
let pokemonByEnName = {};
let selectedFile = null;

function showStatus(text) {
  statusText.textContent = text;
  statusEl.classList.add("visible");
}

function hideStatus() {
  statusEl.classList.remove("visible");
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.add("visible");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.remove("visible");
}

function clearResult() {
  resultCard.classList.remove("visible");
}

async function init() {
  showStatus("模型載入中...");
  pickBtn.disabled = true;
  try {
    const [labelsResp, listResp] = await Promise.all([
      fetch(LABELS_URL),
      fetch(POKEMON_LIST_URL),
    ]);
    classLabels = await labelsResp.json();
    const pokemonList = await listResp.json();
    pokemonByEnName = pokemonList.reduce((acc, p) => {
      acc[p.name_en.toLowerCase()] = p;
      return acc;
    }, {});

    session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["wasm"],
    });

    hideStatus();
  } catch (err) {
    console.error(err);
    hideStatus();
    showError("模型載入失敗，請重新整理頁面再試一次");
  } finally {
    pickBtn.disabled = false;
  }
}

function findMatchingPokemon(predictedLabel) {
  const lower = predictedLabel.toLowerCase();
  if (pokemonByEnName[lower]) return pokemonByEnName[lower];

  const baseName = lower.split("-")[0];
  for (const key in pokemonByEnName) {
    if (key.startsWith(baseName)) return pokemonByEnName[key];
  }

  return {
    name: "未知寶可夢",
    name_en: predictedLabel,
    types: ["未知"],
  };
}

function preprocessImage(imgEl) {
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgEl, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
  const { data } = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);

  const chw = new Float32Array(3 * IMAGE_SIZE * IMAGE_SIZE);
  const plane = IMAGE_SIZE * IMAGE_SIZE;
  for (let i = 0; i < plane; i++) {
    const r = data[i * 4] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;
    chw[i] = (r - MEAN[0]) / STD[0];
    chw[plane + i] = (g - MEAN[1]) / STD[1];
    chw[2 * plane + i] = (b - MEAN[2]) / STD[2];
  }

  return new ort.Tensor("float32", chw, [1, 3, IMAGE_SIZE, IMAGE_SIZE]);
}

function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

async function runPrediction() {
  if (!selectedFile || !session) return;

  clearError();
  clearResult();
  predictBtn.disabled = true;
  showStatus("尋找寶可夢中...");

  try {
    const inputTensor = preprocessImage(previewImg);
    const feeds = { input: inputTensor };
    const outputMap = await session.run(feeds);
    const outputTensor = outputMap[Object.keys(outputMap)[0]];
    const logits = Array.from(outputTensor.data);
    const probs = softmax(logits);

    let bestIdx = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[bestIdx]) bestIdx = i;
    }

    const predictedLabel = classLabels[bestIdx];
    const confidence = probs[bestIdx];
    const matched = findMatchingPokemon(predictedLabel);

    renderResult(matched, predictedLabel, confidence);
  } catch (err) {
    console.error(err);
    showError("預測失敗，請稍後再試");
  } finally {
    hideStatus();
    predictBtn.disabled = false;
  }
}

function renderResult(matched, predictedLabel, confidence) {
  const isKnown = matched.name !== "未知寶可夢";
  resultZh.textContent = isKnown ? matched.name : "未知寶可夢";
  resultEn.textContent = isKnown ? matched.name_en : predictedLabel;

  resultMeta.innerHTML = "";
  if (isKnown && matched.index) {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = `#${matched.index}`;
    resultMeta.appendChild(pill);
  }
  if (isKnown && matched.generation) {
    const pill = document.createElement("span");
    pill.className = "pill gen";
    pill.textContent = matched.generation;
    resultMeta.appendChild(pill);
  }

  resultTypes.innerHTML = "";
  if (isKnown && matched.types) {
    matched.types.forEach((type) => {
      if (!(type in TYPE_COLORS)) return;
      const chip = document.createElement("span");
      chip.className = "type-chip";
      chip.style.backgroundColor = TYPE_COLORS[type];
      chip.textContent = type;
      resultTypes.appendChild(chip);
    });
  }

  resultConfidence.textContent = `信心度：${(confidence * 100).toFixed(1)}%`;

  resultCard.classList.add("visible");
}

pickBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  selectedFile = file;
  clearError();
  clearResult();

  const url = URL.createObjectURL(file);
  previewImg.src = url;
  previewWrap.classList.add("visible");
  predictBtn.disabled = !session;
});

predictBtn.addEventListener("click", runPrediction);

init();
