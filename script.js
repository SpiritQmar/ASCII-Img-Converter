const ASCII_CHARS = "@%#*+=-:. ";

const STYLES = {
    classic: {
        borderChar: '#',
        glitchPhrases: [],
        bgColor: '#1e1e1e',
        textColor: '#d4d4d4',
        accentColor: '#569cd6'
    },
    heart: {
        borderChar: '<3',
        glitchPhrases: ['<3', 'POP', '♥'],
        bgColor: '#2d1b2e',
        textColor: '#ff6b9d',
        accentColor: '#ff1744'
    },
    deadinside: {
        borderChar: 'zxc',
        glitchPhrases: ['ZXC', '1000-7', 'xxx'],
        bgColor: '#0a0a0a',
        textColor: '#9e9e9e',
        accentColor: '#616161'
    }
};

let currentImage = null;
let currentAsciiArt = '';

const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const styleSelect = document.getElementById('styleSelect');
const widthSlider = document.getElementById('widthSlider');
const widthValue = document.getElementById('widthValue');
const glitchSlider = document.getElementById('glitchSlider');
const glitchValue = document.getElementById('glitchValue');
const convertBtn = document.getElementById('convertBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadHtmlBtn = document.getElementById('downloadHtmlBtn');
const output = document.getElementById('output');

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        loadImage(file);
    }
});

widthSlider.addEventListener('input', (e) => {
    widthValue.textContent = e.target.value;
});

glitchSlider.addEventListener('input', (e) => {
    glitchValue.textContent = e.target.value;
});

convertBtn.addEventListener('click', convertImage);
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentAsciiArt).then(() => {
        showToast('Скопировано в буфер обмена! ✓');
    });
});

downloadBtn.addEventListener('click', downloadTxt);
downloadHtmlBtn.addEventListener('click', downloadHtml);

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            uploadArea.innerHTML = `
                <div class="upload-icon">✅</div>
                <div class="upload-text">${file.name}</div>
                <div class="upload-hint">${img.width}x${img.height}</div>
            `;
            convertBtn.disabled = false;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function convertImage() {
    if (!currentImage) return;

    const width = parseInt(widthSlider.value);
    const style = STYLES[styleSelect.value];
    const glitchProb = parseInt(glitchSlider.value) / 100;

    const aspectRatio = currentImage.height / currentImage.width;
    const newWidth = width;
    const newHeight = Math.floor(newWidth * aspectRatio * 0.5);

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(currentImage, 0, 0, newWidth, newHeight);

    const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
    const pixels = imageData.data;

    let asciiStr = '';
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            const offset = (y * newWidth + x) * 4;
            const r = pixels[offset];
            const g = pixels[offset + 1];
            const b = pixels[offset + 2];
            const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
            const charIndex = Math.floor(gray / 32);
            asciiStr += ASCII_CHARS[Math.min(charIndex, ASCII_CHARS.length - 1)];
        }
        asciiStr += '\n';
    }

    asciiStr = addAsciiBorder(asciiStr, style.borderChar);

    if (glitchProb > 0 && style.glitchPhrases.length > 0) {
        asciiStr = addGlitchEffect(asciiStr, style.glitchPhrases, glitchProb);
    }

    currentAsciiArt = asciiStr;
    renderAsciiWithPretext(asciiStr, style);

    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    downloadHtmlBtn.disabled = false;
}

function addAsciiBorder(asciiArt, borderChar) {
    const lines = asciiArt.split('\n').filter(line => line.length > 0);
    const maxLength = Math.max(...lines.map(line => line.length));
    const borderWidth = Math.max(3, Math.floor(borderChar.length));
    
    const border = borderChar.repeat(Math.ceil((maxLength + borderWidth * 2) / borderChar.length));
    let bordered = '';
    
    for (let i = 0; i < borderWidth; i++) {
        bordered += border + '\n';
    }
    
    for (const line of lines) {
        const padding = ' '.repeat(Math.max(0, maxLength - line.length));
        bordered += borderChar.repeat(Math.ceil(borderWidth / borderChar.length)) + line + padding + borderChar.repeat(Math.ceil(borderWidth / borderChar.length)) + '\n';
    }
    
    for (let i = 0; i < borderWidth; i++) {
        bordered += border + '\n';
    }
    
    return bordered;
}

function addGlitchEffect(asciiArt, phrases, probability) {
    const lines = asciiArt.split('\n');
    const glitched = lines.map(line => {
        let result = '';
        let i = 0;
        while (i < line.length) {
            if (Math.random() < probability) {
                const phrase = phrases[Math.floor(Math.random() * phrases.length)];
                result += phrase;
                i += phrase.length;
            } else {
                result += line[i];
                i++;
            }
        }
        return result;
    });
    return glitched.join('\n');
}

function renderAsciiWithPretext(asciiArt, style) {
    output.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'ascii-output';
    container.style.backgroundColor = style.bgColor;
    container.style.color = style.textColor;
    
    if (typeof pretext !== 'undefined') {
        const font = '12px monospace';
        const containerWidth = output.clientWidth - 20;
        
        try {
            const prepared = pretext.prepare(asciiArt, font);
            const layout = pretext.layout(prepared, containerWidth);
            
            const pre = document.createElement('pre');
            pre.style.font = font;
            pre.style.lineHeight = '1.2';
            pre.style.margin = '0';
            pre.style.padding = '10px';
            pre.style.overflow = 'auto';
            pre.style.maxHeight = '70vh';
            pre.textContent = asciiArt;
            
            container.appendChild(pre);
        } catch (e) {
            console.warn('Pretext error, using fallback:', e);
            renderFallback(container, asciiArt);
        }
    } else {
        renderFallback(container, asciiArt);
    }
    
    output.appendChild(container);
    showToast('ASCII-арт успешно создан! ✨');
}

function renderFallback(container, asciiArt) {
    const pre = document.createElement('pre');
    pre.style.fontFamily = 'monospace';
    pre.style.fontSize = '12px';
    pre.style.lineHeight = '1.2';
    pre.style.margin = '0';
    pre.style.padding = '10px';
    pre.style.overflow = 'auto';
    pre.style.maxHeight = '70vh';
    pre.textContent = asciiArt;
    container.appendChild(pre);
}

function downloadTxt() {
    if (!currentAsciiArt) return;
    
    const blob = new Blob([currentAsciiArt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-art.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Файл скачан! 💾');
}

function downloadHtml() {
    if (!currentAsciiArt) return;
    
    const style = STYLES[styleSelect.value];
    const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>ASCII Art</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: ${style.bgColor};
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        pre {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            color: ${style.textColor};
            margin: 0;
            white-space: pre;
        }
    </style>
</head>
<body>
    <pre>${escapeHtml(currentAsciiArt)}</pre>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-art.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('HTML файл скачан! 🌐');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
