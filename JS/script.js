// Base de datos de productos expandida
const productDatabase = {
    '7501234567890': { name: 'Coca Cola 600ml', price: 25.50 },
    '7501234567891': { name: 'Pepsi 600ml', price: 24.00 },
    '7501234567892': { name: 'Sabritas Originales 45g', price: 18.00 },
    '7501234567893': { name: 'Leche Lala 1L', price: 22.50 },
    '7501234567894': { name: 'Pan Bimbo Blanco Grande', price: 35.00 },
    '7501234567895': { name: 'Café Nescafé Clásico 200g', price: 89.00 },
    '7501234567896': { name: 'Coca Cola 2L', price: 35.99 },
    '7501234567897': { name: 'Agua Ciel 1.5L', price: 12.00 },
    '7501234567898': { name: 'Galletas Oreo 154g', price: 28.50 },
    '7501234567899': { name: 'Cerveza Corona 355ml', price: 22.00 },
    '1234567890123': { name: 'Producto de Prueba', price: 15.75 },
    '9876543210987': { name: 'Detergente Ace 1kg', price: 45.00 },
    '5432167890123': { name: 'Shampoo Pantene 400ml', price: 67.50 },
    '1111111111111': { name: 'Test Product', price: 10.00 }
};

let stream = null;
let isScanning = false;
let countdownInterval = null;

const video = document.getElementById('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const productPopup = document.getElementById('productPopup');
const popupOverlay = document.getElementById('popupOverlay');
const noCameraMessage = document.getElementById('noCameraMessage');

// Función para mostrar el popup del producto con countdown
function showProductPopup(barcode, product) {
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productPrice').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('productBarcode').textContent = `Código: ${barcode}`;

    popupOverlay.classList.add('show');
    productPopup.classList.add('show');

    // Countdown de 4 segundos
    let countdown = 4;
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

function hideProductPopup() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    popupOverlay.classList.remove('show');
    productPopup.classList.remove('show');
}

// Función para buscar producto
function searchProduct(barcode) {
    const cleanBarcode = barcode.replace(/\s+/g, '');

    if (productDatabase[cleanBarcode]) {
        showStatus(`✅ Producto encontrado: ${productDatabase[cleanBarcode].name}`, 'success');
        showProductPopup(cleanBarcode, productDatabase[cleanBarcode]);

        // Vibrar el dispositivo si está disponible
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }

        return true;
    } else {
        showStatus('❌ Producto no encontrado en la base de datos', 'error');
        return false;
    }
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';

    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

// Iniciar cámara
startBtn.addEventListener('click', async () => {
    try {
        showStatus('🔄 Iniciando cámara...', 'success');

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        video.srcObject = stream;
        video.style.display = 'block';
        noCameraMessage.style.display = 'none';

        // Inicializar Quagga para escaneo
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: video,
                constraints: {
                    width: { min: 640, ideal: 1280 },
                    height: { min: 480, ideal: 720 },
                    facingMode: "environment"
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: 2,
            frequency: 10,
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "code_39_vin_reader",
                    "codabar_reader",
                    "upc_reader",
                    "upc_e_reader"
                ]
            },
            locate: true
        }, (err) => {
            if (err) {
                console.error('Error al inicializar Quagga:', err);
                showStatus('❌ Error al inicializar el escáner', 'error');
                return;
            }

            Quagga.start();
            isScanning = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            showStatus('📷 Cámara activa - Apunta al código de barras', 'success');
        });

        // Detectar códigos de barras
        Quagga.onDetected((data) => {
            if (isScanning) {
                const barcode = data.codeResult.code;
                console.log('Código detectado:', barcode);
                searchProduct(barcode);
            }
        });

    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        showStatus('❌ Error al acceder a la cámara. Verifica los permisos.', 'error');
    }
});

// Detener cámara
stopBtn.addEventListener('click', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    if (isScanning) {
        Quagga.stop();
        isScanning = false;
    }

    video.srcObject = null;
    video.style.display = 'none';
    noCameraMessage.style.display = 'block';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    showStatus('⏹️ Cámara detenida', 'success');
});



// Cerrar popup al hacer clic en overlay
popupOverlay.addEventListener('click', hideProductPopup);

// Rotar publicidad cada 5 segundos
const ads = [
    { banner: '🎯 ¡OFERTA!', text: 'Coca Cola 2L', price: '$35.99' },
    { banner: '🔥 HOY SOLO', text: 'Pan Bimbo', price: '$35.00' },
    { banner: '💥 PROMOCIÓN', text: 'Sabritas 2x1', price: '$18.00' },
    { banner: '⭐ ESPECIAL', text: 'Café Nescafé', price: '$89.00' }
];

let currentAdIndex = 0;
setInterval(() => {
    currentAdIndex = (currentAdIndex + 1) % ads.length;
    const ad = ads[currentAdIndex];
    document.querySelector('.ads-banner').textContent = ad.banner;
    document.querySelector('.ads-text').textContent = ad.text;
    document.querySelector('.ads-price').textContent = ad.price;
}, 5000);

// Mostrar códigos de ejemplo al cargar
window.addEventListener('load', () => {
    setTimeout(() => {
        showStatus('📷 Activa la cámara para comenzar a escanear códigos de barras', 'success');
    }, 2000);
});