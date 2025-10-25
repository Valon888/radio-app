// Create an empty favicon to stop 404 errors
const canvas = document.createElement('canvas');
canvas.width = 16;
canvas.height = 16;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#0078d7'; // Blue color
ctx.fillRect(0, 0, 16, 16);

// Convert to blob and create URL
canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = url;
    document.head.appendChild(link);
});
