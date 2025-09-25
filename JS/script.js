// Producto base
const productDatabase = {
  '7501234567890': { name: 'Coca Cola 600ml', price: 25 },
  '7501234567891': { name: 'Pepsi 600ml', price: 24 },
  '7501234567892': { name: 'Sabritas Originales 45g', price: 18 },
  '7501234567893': { name: 'Leche Lala 1L', price: 22 },
  '7501234567894': { name: 'Pan Bimbo Blanco Grande', price: 35 },
  '7501234567895': { name: 'Café Nescafé Clásico 200g', price: 89 },
  '7501234567896': { name: 'Coca Cola 2L', price: 35 },
  '9876543210987': { name: 'Detergente Ace 1kg', price: 45 },
  '5432167890123': { name: 'Shampoo Pantene 400ml', price: 67 }
};

let stream = null;
let isScanning = false;
let countdownInterval = null;
let lastScannedCode = null;
let scanCooldown = false;

const video = document.getElementById('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const productPopup = document.getElementById('productPopup');
const popupOverlay = document.getElementById('popupOverlay');
const noCameraMessage = document.getElementById('noCameraMessage');

// Mostrar popup del producto
function showProductPopup(barcode, product) {
  document.getElementById('productName').textContent = product.name;
  document.getElementById('productPrice').textContent = `$${product.price.toFixed(2)}`;
  document.getElementById('productBarcode').textContent = `Código: ${barcode}`;

  popupOverlay.classList.add('show');
  productPopup.classList.add('show');

  // Countdown 2s
  let countdown = 2;
  const countdownElement = document.getElementById('countdown');

  countdownInterval = setInterval(() => {
    countdown--;
    countdownElement.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      hideProductPopup();
    }
  }, 1000);
}

// Ocultar popup y permitir nuevo escaneo
function hideProductPopup() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  popupOverlay.classList.remove('show');
  productPopup.classList.remove('show');

  // Reset para permitir nuevo escaneo inmediatamente
  lastScannedCode = null;
  scanCooldown = false;
}

// Buscar producto
function searchProduct(barcode) {
  const cleanBarcode = barcode.replace(/\s+/g, '');

  if (scanCooldown || lastScannedCode === cleanBarcode) return;

  scanCooldown = true;
  lastScannedCode = cleanBarcode;

  setTimeout(() => scanCooldown = false, 1500);

  if (productDatabase[cleanBarcode]) {
    showStatus(`<i class="fa-solid fa-check-circle"></i> ${productDatabase[cleanBarcode].name}`, 'success');
    showProductPopup(cleanBarcode, productDatabase[cleanBarcode]);
    if ('vibrate' in navigator) navigator.vibrate(200);
  } else {
    showStatus('<i class="fa-solid fa-triangle-exclamation"></i> Producto no encontrado', 'error');
  }
}

// Mostrar estado
function showStatus(message, type) {
  status.innerHTML = message;
  status.className = `status ${type}`;
  status.style.display = 'block';

  setTimeout(() => { status.style.display = 'none'; }, 2500);
}

// Inicializar cámara
async function initializeCamera() {
  try {
    showStatus('<i class="fa-solid fa-spinner fa-spin"></i> Iniciando cámara...', 'success');
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });

    video.srcObject = stream;
    video.style.display = 'block';
    noCameraMessage.style.display = 'none';

    video.addEventListener('loadedmetadata', () => {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: video,
          constraints: { facingMode: "environment" }
        },
        locator: { patchSize: "medium", halfSample: true },
        decoder: { readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader"] },
        locate: true
      }, (err) => {
        if (err) {
          showStatus('<i class="fa-solid fa-times-circle"></i> Error al inicializar escáner', 'error');
          return;
        }
        Quagga.start();
        isScanning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        showStatus('<i class="fa-solid fa-camera"></i> Cámara lista', 'success');
      });
    });

    Quagga.onDetected(data => {
      if (isScanning && !scanCooldown) {
        searchProduct(data.codeResult.code);
      }
    });

  } catch (error) {
    showStatus('<i class="fa-solid fa-ban"></i> Error al acceder a la cámara', 'error');
    noCameraMessage.innerHTML = `
      <div class="no-camera-icon"><i class="fa-solid fa-video-slash"></i></div>
      <div>Error al acceder a la cámara</div>
      <div style="font-size: 14px; margin-top: 10px;">Toca "Activar" para intentar de nuevo</div>`;
    startBtn.disabled = false;
  }
}

// Eventos botones
startBtn.addEventListener('click', initializeCamera);
stopBtn.addEventListener('click', () => {
  if (stream) stream.getTracks().forEach(track => track.stop());
  if (isScanning) Quagga.stop();
  isScanning = false;
  stream = null;

  video.srcObject = null;
  video.style.display = 'none';
  noCameraMessage.style.display = 'block';
  noCameraMessage.innerHTML = `<div class="no-camera-icon"><i class="fa-solid fa-video"></i></div>Cámara detenida`;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  showStatus('<i class="fa-solid fa-stop"></i> Cámara detenida', 'success');
});

// Popup overlay
popupOverlay.addEventListener('click', hideProductPopup);

// Rotar publicidad
const ads = [
  { banner: '<i class="fa-solid fa-bullhorn"></i> ¡OFERTA!', text: 'Coca Cola 2L', price: '$35.99' },
  { banner: '<i class="fa-solid fa-fire"></i> HOY SOLO', text: 'Pan Bimbo', price: '$35.00' },
  { banner: '<i class="fa-solid fa-star"></i> PROMO', text: 'Sabritas 2x1', price: '$18.00' }
];
let currentAdIndex = 0;
setInterval(() => {
  currentAdIndex = (currentAdIndex + 1) % ads.length;
  document.querySelector('.ads-banner').innerHTML = ads[currentAdIndex].banner;
  document.querySelector('.ads-text').textContent = ads[currentAdIndex].text;
  document.querySelector('.ads-price').textContent = ads[currentAdIndex].price;
}, 5000);

// Autoinicio cámara
window.addEventListener('load', () => setTimeout(() => initializeCamera(), 500));
