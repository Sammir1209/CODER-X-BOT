import * as ort from 'onnxruntime-web';

console.log("[CODER] hCaptcha Solver AI Cargado");

// Configurar WebAssembly para ONNX Runtime
ort.env.wasm.wasmPaths = chrome.runtime.getURL('assets/');

let session: ort.InferenceSession | null = null;

// Inicializar el modelo YOLOv5/MobileOne
const initModel = async () => {
  try {
    const modelUrl = chrome.runtime.getURL('models/mobileone-s0.ort');
    console.log("[CODER] Cargando modelo ONNX desde:", modelUrl);
    
    // Cargar la sesión del modelo
    session = await ort.InferenceSession.create(modelUrl, { executionProviders: ['wasm'] });
    console.log("[CODER] Modelo ONNX cargado exitosamente.");
  } catch (error) {
    console.error("[CODER] Error cargando modelo ONNX:", error);
  }
};

// Lógica base para detectar el contenedor de hCaptcha
const detectHCaptcha = () => {
  const hcaptchaIframe = document.querySelector('iframe[src*="hcaptcha.com"]');
  if (hcaptchaIframe && session) {
    console.log("[CODER] hCaptcha detectado en la página y modelo listo para inferencia.");
    // Aquí implementaremos la captura de la cuadrícula y el pre-procesamiento del tensor (NCHW)
  }
};

// Observar el DOM en busca de hCaptcha dinámicos
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      detectHCaptcha();
    }
  }
});

// Arrancar sistema
(async () => {
  await initModel();
  observer.observe(document.body, { childList: true, subtree: true });
  detectHCaptcha();
})();
