// Simple icon generator for Chrome extension
// Run this in a browser console or Node.js with canvas support

function generateIconDataURL(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#D4A37F';
    ctx.fillRect(0, 0, size, size);

    // White container
    const padding = size * 0.15;
    const containerHeight = size * 0.5;
    const containerY = size * 0.25;

    ctx.fillStyle = 'white';
    ctx.fillRect(padding, containerY, size - 2 * padding, containerHeight);

    // Bars
    const barWidth = Math.max(1, size * 0.04);
    const barSpacing = size * 0.12;
    const startX = padding + size * 0.08;
    const barBottomY = containerY + containerHeight - size * 0.08;

    ctx.fillStyle = '#D4A37F';

    // Bar heights (relative to container)
    const heights = [0.8, 0.5, 0.7, 0.8, 0.4];

    for (let i = 0; i < Math.min(5, Math.floor((size - 2 * padding - size * 0.16) / barSpacing)); i++) {
        const x = startX + i * barSpacing;
        const height = (containerHeight - size * 0.16) * heights[i];
        const y = barBottomY - height;

        ctx.fillRect(x, y, barWidth, height);
    }

    return canvas.toDataURL('image/png');
}

// Instructions:
console.log('Copy and save these data URLs as PNG files:');
console.log('16x16:', generateIconDataURL(16));
console.log('32x32:', generateIconDataURL(32));
console.log('48x48:', generateIconDataURL(48));
console.log('128x128:', generateIconDataURL(128));
