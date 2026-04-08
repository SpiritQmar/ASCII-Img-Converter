const CHARSETS = {
    detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
    blocks: "\u2588\u2593\u2592\u2591 "
};

const STYLE_CHARSETS = {
    classic: "@%#*+=-:. ",
    heart: "\u2661<3xXoO*~=-. ",
    deadinside: "ZXxxxc71000-_+=:. "
};

const DEFAULT_STYLES = {
    classic: { name: "Classic", borderChar: '#', glitchPhrases: [], bgColor: '#1e1e1e', textColor: '#d4d4d4', accentColor: '#569cd6' },
    heart: { name: "Pick Me", borderChar: '<3', glitchPhrases: ['<3', 'xo', '♡'], bgColor: '#ffe4f0', textColor: '#ff1493', accentColor: '#ff69b4' },
    deadinside: { name: "Dead Inside", borderChar: 'zxc', glitchPhrases: ['zx', 'xc', '7'], bgColor: '#0a0a0a', textColor: '#8b0000', accentColor: '#ff0000' }
};

const BORDER_CHARS = {
    solid: { tl: '\u250C', tr: '\u2510', bl: '\u2514', br: '\u2518', h: '\u2500', v: '\u2502' },
    double: { tl: '\u2554', tr: '\u2557', bl: '\u255A', br: '\u255D', h: '\u2550', v: '\u2551' },
    dashed: { tl: '\u250E', tr: '\u2513', bl: '\u2517', br: '\u251B', h: '\u2504', v: '\u2506' },
    rounded: { tl: '\u256D', tr: '\u256E', bl: '\u2570', br: '\u256F', h: '\u2500', v: '\u2502' }
};

let state = {
    currentImage: null,
    currentAsciiArt: '',
    customStyles: JSON.parse(localStorage.getItem('asciiCustomStyles') || '{}'),
    currentEditStyle: null
};

const elements = {
    fileInput: document.getElementById('fileInput'),
    uploadArea: document.getElementById('uploadArea'),
    canvas: document.getElementById('canvas'),
    styleSelect: document.getElementById('styleSelect'),
    widthSlider: document.getElementById('widthSlider'),
    widthValue: document.getElementById('widthValue'),
    glitchSlider: document.getElementById('glitchSlider'),
    glitchValue: document.getElementById('glitchValue'),
    colorMode: document.getElementById('colorMode'),
    gradientMode: document.getElementById('gradientMode'),
    highlightStyle: document.getElementById('highlightStyle'),
    charsetSelect: document.getElementById('charsetSelect'),
    brightnessSlider: document.getElementById('brightnessSlider'),
    brightnessValue: document.getElementById('brightnessValue'),
    contrastSlider: document.getElementById('contrastSlider'),
    contrastValue: document.getElementById('contrastValue'),
    blurSlider: document.getElementById('blurSlider'),
    blurValue: document.getElementById('blurValue'),
    gammaSlider: document.getElementById('gammaSlider'),
    gammaValue: document.getElementById('gammaValue'),
    thresholdSlider: document.getElementById('thresholdSlider'),
    thresholdValue: document.getElementById('thresholdValue'),
    edgeDetect: document.getElementById('edgeDetect'),
    ditherMode: document.getElementById('ditherMode'),
    invertFilter: document.getElementById('invertFilter'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    borderSelect: document.getElementById('borderSelect'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    downloadHtmlBtn: document.getElementById('downloadHtmlBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    fullscreenOverlay: document.getElementById('fullscreenOverlay'),
    fullscreenContent: document.getElementById('fullscreenContent'),
    fullscreenTitle: document.getElementById('fullscreenTitle'),
    closeFullscreenBtn: document.getElementById('closeFullscreenBtn'),
    output: document.getElementById('output'),
    outputInfo: document.getElementById('outputInfo'),
    styleModal: document.getElementById('styleModal'),
    styleName: document.getElementById('styleName'),
    styleBorder: document.getElementById('styleBorder'),
    styleBg: document.getElementById('styleBg'),
    styleText: document.getElementById('styleText'),
    styleGlitch: document.getElementById('styleGlitch'),
    editStyleBtn: document.getElementById('editStyleBtn'),
    modalClose: document.getElementById('modalClose'),
    saveStyleBtn: document.getElementById('saveStyleBtn'),
    deleteStyleBtn: document.getElementById('deleteStyleBtn'),
    toastContainer: document.getElementById('toastContainer')
};

const ctx = elements.canvas.getContext('2d', { willReadFrequently: true });
let previewTimeout = null;

function init() { loadStyles(); setupEvents(); }

function loadStyles() {
    elements.styleSelect.innerHTML = '';
    Object.entries({ ...DEFAULT_STYLES, ...state.customStyles }).forEach(([k, v]) => {
        const o = document.createElement('option');
        o.value = k; o.textContent = v.name;
        elements.styleSelect.appendChild(o);
    });
}

function setupEvents() {
    elements.uploadArea.onclick = () => elements.fileInput.click();
    elements.uploadArea.ondragover = e => { e.preventDefault(); elements.uploadArea.classList.add('drag-over'); };
    elements.uploadArea.ondragleave = () => elements.uploadArea.classList.remove('drag-over');
    elements.uploadArea.ondrop = e => { e.preventDefault(); elements.uploadArea.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
    elements.fileInput.onchange = e => { if (e.target.files[0]) handleFile(e.target.files[0]); };

    const bindSlider = (slider, display, cb) => slider.oninput = e => { display.textContent = e.target.value; cb?.(); schedulePreview(); };
    bindSlider(elements.widthSlider, elements.widthValue);
    bindSlider(elements.glitchSlider, elements.glitchValue);
    bindSlider(elements.brightnessSlider, elements.brightnessValue);
    bindSlider(elements.contrastSlider, elements.contrastValue);
    bindSlider(elements.blurSlider, elements.blurValue);
    bindSlider(elements.gammaSlider, elements.gammaValue, () => elements.gammaValue.textContent = (elements.gammaSlider.value / 10).toFixed(1));
    bindSlider(elements.thresholdSlider, elements.thresholdValue);

    ['colorMode', 'gradientMode', 'highlightStyle', 'invertFilter', 'edgeDetect', 'ditherMode', 'charsetSelect', 'borderSelect'].forEach(id => {
        elements[id].onchange = () => schedulePreview();
    });
    elements.styleSelect.onchange = () => schedulePreview();
    elements.resetFiltersBtn.onclick = resetFilters;
    elements.copyBtn.onclick = () => navigator.clipboard.writeText(state.currentAsciiArt).then(() => showToast('Copied'));
    elements.downloadBtn.onclick = downloadTxt;
    elements.downloadHtmlBtn.onclick = downloadHtml;
    elements.editStyleBtn.onclick = openStyleEditor;
    elements.modalClose.onclick = () => elements.styleModal.setAttribute('hidden', '');
    elements.saveStyleBtn.onclick = saveCustomStyle;
    elements.deleteStyleBtn.onclick = deleteCustomStyle;
    elements.styleModal.onclick = e => { if (e.target === elements.styleModal) elements.styleModal.setAttribute('hidden', ''); };
    elements.fullscreenBtn.onclick = openFullscreen;
    elements.closeFullscreenBtn.onclick = () => elements.fullscreenOverlay.hidden = true;
}

function resetFilters() {
    elements.brightnessSlider.value = elements.contrastSlider.value = elements.blurSlider.value = elements.thresholdSlider.value = 0;
    elements.gammaSlider.value = 10;
    elements.gammaValue.textContent = '1.0';
    [elements.brightnessValue, elements.contrastValue, elements.blurValue, elements.thresholdValue].forEach(el => el.textContent = '0');
    elements.invertFilter.checked = elements.edgeDetect.checked = elements.ditherMode.checked = false;
    schedulePreview();
    showToast('Filters reset');
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            state.currentImage = img;
            elements.uploadArea.innerHTML = `<div class="upload-icon">${file.name.charAt(0).toUpperCase()}</div><div class="upload-text">${file.name}</div><div class="upload-hint">${img.width}x${img.height}</div>`;
            schedulePreview();
            showToast('Image loaded');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function schedulePreview() {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => { if (state.currentImage) processImage(); }, 100);
}

function getCharset() {
    const t = elements.charsetSelect.value;
    const sk = elements.styleSelect.value;
    if (STYLE_CHARSETS[sk] && t === 'detailed') return STYLE_CHARSETS[sk];
    return CHARSETS[t] || CHARSETS.blocks;
}

function getStyle() { return { ...DEFAULT_STYLES, ...state.customStyles }[elements.styleSelect.value] || DEFAULT_STYLES.classic; }

function getBorder() { return BORDER_CHARS[elements.borderSelect.value]; }

function applyImgFilters(data) {
    const d = data.data;
    const bri = parseInt(elements.brightnessSlider.value);
    const con = parseInt(elements.contrastSlider.value);
    const inv = elements.invertFilter.checked;
    const thr = parseInt(elements.thresholdSlider.value);
    const edge = elements.edgeDetect.checked;
    const dith = elements.ditherMode.checked;
    const gamma = parseInt(elements.gammaSlider.value) / 10;

    const cf = (259 * (con + 255)) / (255 * (259 - con));

    for (let i = 0; i < d.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            let v = d[i + c];
            v += bri;
            v = cf * (v - 128) + 128;
            if (gamma !== 1) v = 255 * Math.pow(v / 255, 1 / gamma);
            if (inv) v = 255 - v;
            d[i + c] = Math.max(0, Math.min(255, Math.round(v)));
        }
    }

    if (edge) {
        const w = data.width, h = data.height;
        const gray = new Float32Array(w * h);
        for (let i = 0; i < w * h; i++) gray[i] = 0.299 * d[i*4] + 0.587 * d[i*4+1] + 0.114 * d[i*4+2];
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const i = y * w + x;
                const gx = -gray[(y-1)*w+x-1] + gray[(y-1)*w+x+1] - 2*gray[y*w+x-1] + 2*gray[y*w+x+1] - gray[(y+1)*w+x-1] + gray[(y+1)*w+x+1];
                const gy = -gray[(y-1)*w+x-1] - 2*gray[(y-1)*w+x] - gray[(y-1)*w+x+1] + gray[(y+1)*w+x-1] + 2*gray[(y+1)*w+x] + gray[(y+1)*w+x+1];
                const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
                const idx = i * 4;
                d[idx] = d[idx+1] = d[idx+2] = 255 - mag;
            }
        }
    }

    if (thr > 0) {
        for (let i = 0; i < d.length; i += 4) {
            const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
            const v = g >= thr ? 255 : 0;
            d[i] = d[i+1] = d[i+2] = v;
        }
    }

    if (dith) {
        const w = data.width, h = data.height;
        const gray = new Float32Array(w * h);
        for (let i = 0; i < w * h; i++) gray[i] = 0.299 * d[i*4] + 0.587 * d[i*4+1] + 0.114 * d[i*4+2];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                const old = gray[i];
                const v = old < 128 ? 0 : 255;
                gray[i] = v;
                const err = old - v;
                if (x + 1 < w) gray[y * w + x + 1] += err * 7 / 16;
                if (y + 1 < h) {
                    if (x > 0) gray[(y + 1) * w + x - 1] += err * 3 / 16;
                    gray[(y + 1) * w + x] += err * 5 / 16;
                    if (x + 1 < w) gray[(y + 1) * w + x + 1] += err * 1 / 16;
                }
            }
        }
        for (let i = 0; i < w * h; i++) { d[i*4] = d[i*4+1] = d[i*4+2] = gray[i]; }
    }

    const blur = parseInt(elements.blurSlider.value);
    if (blur > 0) {
        elements.canvas.width = data.width; elements.canvas.height = data.height;
        ctx.putImageData(data, 0, 0);
        ctx.filter = `blur(${blur}px)`;
        ctx.drawImage(elements.canvas, 0, 0);
        return ctx.getImageData(0, 0, data.width, data.height);
    }
    return data;
}

function processImage() {
    if (!state.currentImage) return;

    const w = parseInt(elements.widthSlider.value);
    const style = getStyle();
    const borderType = elements.borderSelect.value;
    const gProb = parseInt(elements.glitchSlider.value) / 100;
    const useColor = elements.colorMode.checked;
    const useGrad = elements.gradientMode.checked;
    const charset = getCharset();

    const ar = state.currentImage.height / state.currentImage.width;
    const nw = w, nh = Math.floor(nw * ar * 0.5);

    elements.canvas.width = nw; elements.canvas.height = nh;
    ctx.drawImage(state.currentImage, 0, 0, nw, nh);

    let imgData = ctx.getImageData(0, 0, nw, nh);
    imgData = applyImgFilters(imgData);
    const px = imgData.data;

    let ascii = '', html = '';

    for (let y = 0; y < nh; y++) {
        for (let x = 0; x < nw; x++) {
            const o = (y * nw + x) * 4;
            const r = px[o], g = px[o+1], b = px[o+2];
            const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
            const ci = Math.floor(gray / 255 * (charset.length - 1));
            const ch = charset[Math.min(ci, charset.length - 1)];

            if (useColor || useGrad) {
                if (useGrad) {
                    const hue = (gray / 255) * 360;
                    html += `<span style="color:hsl(${hue},80%,60%)">${ch}</span>`;
                } else {
                    html += `<span style="color:rgb(${r},${g},${b})">${ch}</span>`;
                }
            } else { ascii += ch; }
        }
        if (!useColor && !useGrad) ascii += '\n';
        if (useColor || useGrad) html += '\n';
    }

    const brd = getBorder();

    if (!useColor && !useGrad) {
        ascii = addBorder(ascii, brd, borderType);
        if (gProb > 0 && style.glitchPhrases.length > 0) ascii = addGlitch(ascii, style.glitchPhrases, gProb);
        ascii = applyGlitch(ascii, gProb);
        state.currentAsciiArt = ascii;
        renderAscii(ascii, style);
    } else {
        let bordered = addBorderHtml(html, brd, borderType);
        if (gProb > 0 && style.glitchPhrases.length > 0) bordered = addGlitchHtml(bordered, style.glitchPhrases, gProb);
        bordered = applyGlitchHtml(bordered, gProb);
        bordered = highlightSymbols(bordered, style, style.glitchPhrases);
        state.currentAsciiArt = bordered.replace(/<[^>]*>/g, '');
        renderColorAscii(bordered, style);
    }

    elements.copyBtn.disabled = false;
    elements.downloadBtn.disabled = false;
    elements.downloadHtmlBtn.disabled = false;
    elements.outputInfo.textContent = `${nw}x${nh} | ${charset.length} chars`;
}

function addBorder(text, brd, type) {
    if (type === 'none') return text;
    const lines = text.split('\n');
    const nonEmpty = lines.filter(l => l.trim().length > 0);
    if (!nonEmpty.length) return text;
    const ml = Math.max(...nonEmpty.map(l => l.length));

    let r = brd.tl + brd.h.repeat(ml) + brd.tr + '\n';
    for (const line of lines) {
        const pl = line.replace(/\s+$/, '');
        const pad = ' '.repeat(Math.max(0, ml - pl.length));
        r += brd.v + pl + pad + brd.v + '\n';
    }
    r += brd.bl + brd.h.repeat(ml) + brd.br + '\n';
    return r;
}

function addBorderHtml(html, brd, type) {
    if (type === 'none') return html;
    const lines = html.split('\n');
    const nonEmpty = lines.filter(l => l.replace(/<[^>]*>/g, '').trim().length > 0);
    if (!nonEmpty.length) return html;
    const ml = Math.max(...nonEmpty.map(l => l.replace(/<[^>]*>/g, '').length));

    let r = brd.tl + brd.h.repeat(ml) + brd.tr + '\n';
    for (const line of lines) {
        const pl = line.length > 0 ? line : '';
        const plainLen = line.replace(/<[^>]*>/g, '').length;
        const pad = ' '.repeat(Math.max(0, ml - plainLen));
        r += brd.v + pl + pad + brd.v + '\n';
    }
    r += brd.bl + brd.h.repeat(ml) + brd.br + '\n';
    return r;
}

function addGlitch(text, phrases, prob) {
    return text.split('\n').map(line => {
        let r = '';
        for (let i = 0; i < line.length; i++) {
            if (Math.random() < prob) {
                if (Math.random() < 0.3) {
                    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
                    r += phrase;
                } else {
                    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
                    r += phrase.charAt(Math.floor(Math.random() * phrase.length));
                }
            } else {
                r += line[i];
            }
        }
        return r;
    }).join('\n');
}

function addGlitchHtml(html, phrases, prob) {
    let r = ''; let i = 0;
    while (i < html.length) {
        if (html[i] === '<') { let t = ''; while (i < html.length && html[i] !== '>') t += html[i++]; if (i < html.length) t += html[i++]; r += t; }
        else if (html[i] === ' ') { r += ' '; i++; }
        else if (Math.random() < prob) { r += phrases[Math.floor(Math.random() * phrases.length)].charAt(0); i++; }
        else { r += html[i]; i++; }
    }
    return r;
}

function applyGlitch(text, prob) {
    if (prob <= 0) return text;
    return text.split('\n').map(line => {
        if (Math.random() < prob * 0.3) {
            const s = Math.floor(Math.random() * 4) + 1;
            line = Math.random() > 0.5 ? ' '.repeat(s) + line : line.substring(s);
        }
        if (Math.random() < prob * 0.15 && line.length > 0) {
            const p = Math.floor(Math.random() * line.length);
            line = line.substring(0, p) + ['\u2591', '\u2592', '\u2593'][Math.floor(Math.random() * 3)] + line.substring(p + 1);
        }
        if (Math.random() < prob * 0.1) {
            const chars = line.split('');
            const a = Math.floor(Math.random() * chars.length);
            const b = Math.floor(Math.random() * chars.length);
            [chars[a], chars[b]] = [chars[b], chars[a]];
            line = chars.join('');
        }
        return line;
    }).join('\n');
}

function applyGlitchHtml(html, prob) {
    if (prob <= 0) return html;
    let r = ''; let i = 0;
    while (i < html.length) {
        if (html[i] === '<') {
            let t = '';
            while (i < html.length && html[i] !== '>') t += html[i++];
            if (i < html.length) t += html[i++];
            r += t;
            continue;
        }
        if (Math.random() < prob * 0.15 && html[i] !== ' ') {
            r += `<span style="color:#ff0000">${['\u2591', '\u2592', '\u2593'][Math.floor(Math.random() * 3)]}</span>`;
        } else if (Math.random() < prob * 0.05) {
            r += html[i];
        } else {
            r += html[i];
        }
        i++;
    }
    return r;
}

function highlightSymbols(html, style, symbols) {
    if (!elements.highlightStyle.checked) return html;
    const chars = new Set(symbols.join('').toLowerCase());
    if (!chars.size) return html;
    const hc = style.accentColor || '#ff00ff';
    let r = ''; let i = 0;
    while (i < html.length) {
        if (html[i] === '<') { let t = ''; while (i < html.length && html[i] !== '>') t += html[i++]; if (i < html.length) t += html[i++]; r += t; }
        else if (html[i] === ' ') { r += ' '; i++; }
        else { if (chars.has(html[i].toLowerCase())) r += `<span style="color:${hc};text-shadow:0 0 6px ${hc};font-weight:bold">${html[i]}</span>`; else r += html[i]; i++; }
    }
    return r;
}

function renderAscii(text, style) {
    elements.output.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:inline-block;';
    const pre = document.createElement('pre');
    pre.className = 'ascii-art fade-in';
    pre.style.cssText = 'font:12px/1.2 monospace;margin:0;padding:15px;';
    pre.textContent = text;
    wrap.appendChild(pre);
    elements.output.appendChild(wrap);
}

function renderColorAscii(html, style) {
    elements.output.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:inline-block;';
    const div = document.createElement('div');
    div.className = 'ascii-color fade-in';
    div.style.cssText = `font:12px/1.2 monospace;background:${style.bgColor};color:${style.textColor};`;
    div.innerHTML = html;
    wrap.appendChild(div);
    elements.output.appendChild(wrap);
}

function openStyleEditor() {
    const s = getStyle();
    state.currentEditStyle = elements.styleSelect.value;
    elements.styleName.value = s.name;
    elements.styleBorder.value = s.borderChar;
    elements.styleBg.value = s.bgColor;
    elements.styleText.value = s.textColor;
    elements.styleGlitch.value = s.glitchPhrases.join(', ');
    elements.styleModal.removeAttribute('hidden');
}

function saveCustomStyle() {
    const key = 'custom_' + (state.currentEditStyle || Date.now());
    const s = { name: elements.styleName.value || 'Custom', borderChar: elements.styleBorder.value || '#', glitchPhrases: elements.styleGlitch.value.split(',').map(x => x.trim()).filter(Boolean), bgColor: elements.styleBg.value, textColor: elements.styleText.value };
    state.customStyles[key] = s;
    localStorage.setItem('asciiCustomStyles', JSON.stringify(state.customStyles));
    loadStyles();
    elements.styleSelect.value = key;
    elements.styleModal.setAttribute('hidden', '');
    showToast('Style saved');
    schedulePreview();
}

function deleteCustomStyle() {
    if (DEFAULT_STYLES[state.currentEditStyle]) { showToast('Cannot delete built-in'); return; }
    delete state.customStyles[state.currentEditStyle];
    localStorage.setItem('asciiCustomStyles', JSON.stringify(state.customStyles));
    loadStyles();
    elements.styleModal.setAttribute('hidden', '');
    showToast('Style deleted');
}

function downloadTxt() {
    if (!state.currentAsciiArt) return;
    const b = new Blob([state.currentAsciiArt], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ascii-art.txt'; a.click();
    URL.revokeObjectURL(a.href);
    showToast('Downloaded');
}

function downloadHtml() {
    if (!state.currentAsciiArt) return;
    const s = getStyle();
    const c = elements.colorMode.checked || elements.gradientMode.checked;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ASCII Art</title><style>body{margin:0;padding:20px;background:${s.bgColor};display:flex;justify-content:center;align-items:center;min-height:100vh}pre,div{font:12px/1.2 monospace;color:${s.textColor};margin:0;white-space:pre}</style></head><body><${c ? 'div' : 'pre'}>${c ? state.currentAsciiArt.replace(/\n/g, '<br>') : state.currentAsciiArt}</${c ? 'div' : 'pre'}></body></html>`;
    const b = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ascii-art.html'; a.click();
    URL.revokeObjectURL(a.href);
    showToast('HTML downloaded');
}

function openFullscreen() {
    const content = elements.output.innerHTML;
    elements.fullscreenContent.innerHTML = content;
    elements.fullscreenTitle.textContent = 'ASCII Art';
    elements.fullscreenOverlay.hidden = false;
}

function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    elements.toastContainer.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2000);
}

init();
