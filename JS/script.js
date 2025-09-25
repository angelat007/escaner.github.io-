// Base de datos de productos expandida
const productDatabase = {
    '7501234567890': { name: 'Coca Cola 600ml', price: 25 },
    '7501234567891': { name: 'Pepsi 600ml', price: 24 },
    '7501234567892': { name: 'Sabritas Originales 45g', price: 18 },
    '7501234567893': { name: 'Leche Lala 1L', price: 22 },
    '7501234567894': { name: 'Pan Bimbo Blanco Grande', price: 35 },
    '7501234567895': { name: 'Café Nescafé Clásico 200g', price: 89 },
    '7501234567896': { name: 'Coca Cola 2L', price: 35 },
    '7501234567897': { name: 'Agua Ciel 1.5L', price: 12 },
    '7501234567898': { name: 'Galletas Oreo 154g', price: 28 },
    '7501234567899': { name: 'Cerveza Corona 355ml', price: 22 },
    '1234567890123': { name: 'Producto de Prueba', price: 15.75 },
    '9876543210987': { name: 'Detergente Ace 1kg', price: 45 },
    '5432167890123': { name: 'Shampoo Pantene 400ml', price: 67 },
    '1111111111111': { name: 'Test Product', price: 10 }
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

// Función para mostrar el popup del producto con countdown
function showProductPopup(barcode, product) {
    safeSetTextById('productName', product.name);
    safeSetTextById('productPrice', `$${product.price.toFixed(2)}`);
    safeSetTextById('productBarcode', `Código: ${barcode}`);

    popupOverlay.classList.add('show');
    productPopup.classList.add('show');

    // Countdown de 2 segundos
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

function hideProductPopup() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    popupOverlay.classList.remove('show');
    productPopup.classList.remove('show');
}

// Función para buscar producto con cooldown
function searchProduct(barcode) {
    const cleanBarcode = barcode.replace(/\s+/g, '');

    // Evitar escaneos múltiples del mismo código
    if (scanCooldown || lastScannedCode === cleanBarcode) {
        return false;
    }

    // Activar cooldown por 2 segundos
    scanCooldown = true;
    lastScannedCode = cleanBarcode;

    setTimeout(() => {
        scanCooldown = false;
    }, 2000);

    if (productDatabase[cleanBarcode]) {
        showStatus(`<i class="fas fa-check-circle"></i> Producto encontrado: ${productDatabase[cleanBarcode].name}`, 'success');
        showProductPopup(cleanBarcode, productDatabase[cleanBarcode]);

        // Vibrar el dispositivo si está disponible
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }

        return true;
    } else {
        showStatus('<i class="fas fa-times-circle"></i> Producto no encontrado en la base de datos', 'error');
        return false;
    }
}

function showStatus(message, type) {
    status.innerHTML = message;
    status.className = `status ${type}`;
    status.style.display = 'block';

    setTimeout(() => {
        status.style.display = 'none';
    }, 2000);
}

// Iniciar cámara manualmente (solo si falló la automática)
startBtn.addEventListener('click', initializeCamera);

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

    // Reset variables
    lastScannedCode = null;
    scanCooldown = false;

    video.srcObject = null;
    video.style.display = 'none';
    noCameraMessage.style.display = 'block';
    noCameraMessage.innerHTML = `
                <div class="no-camera-icon"><i class="fa-solid fa-camera-slash"></i></div>
                <div>Cámara detenida</div>
                <div style="font-size: 14px; margin-top: 10px;">Toca "<i class='fas fa-play-circle'></i> Activar Cámara" para continuar</div>
            `;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    showStatus('<i class="fas fa-stop-circle"></i> Cámara detenida', 'success');
});

// Cerrar popup al hacer clic en overlay
popupOverlay.addEventListener('click', hideProductPopup);

// Rotar publicidad cada 5 segundos
const ads = [
    { banner: '<i class="fas fa-bullhorn"></i> ¡OFERTA!', text: 'Coca Cola 2L', price: '$35.99' },
    { banner: '<i class="fas fa-clock"></i> HOY SOLO', text: 'Pan Bimbo', price: '$35.00' },
    { banner: '<i class="fas fa-tags"></i> PROMOCIÓN', text: 'Sandías 2x1', price: '$159.00' },
    { banner: '<i class="fas fa-star"></i> ESPECIAL', text: 'Café Nescafé', price: '$89.00' }
];

let currentAdIndex = 0;
setInterval(() => {
    currentAdIndex = (currentAdIndex + 1) % ads.length;
    const ad = ads[currentAdIndex];
    document.querySelector('.ads-banner').innerHTML = ad.banner;
    document.querySelector('.ads-text').textContent = ad.text;
    document.querySelector('.ads-price').textContent = ad.price;
}, 5000);

// Inicializar automáticamente al cargar la página
window.addEventListener('load', () => {
    // Pequeño delay para asegurar que todos los elementos estén cargados
    setTimeout(() => {
        initializeCamera();
    }, 400);

});
