export const drawLegend = function(canvas, minValue, maxValue, title) {
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "#FFFFFF";

    const barMarginTop = 12.5;
    const barMarginBot = 12.5;
    const barMarginLeft = 20.5;
    const titleHeight = 40;

    const titleFontSize = 20;
    const fontSize = 16;

    const barWidth = 20;
    const barHeight = canvas.height - barMarginTop - titleHeight - barMarginBot;

    // Draw title
    if(title) {
        ctx.fillStyle = "#000000";
        ctx.font = `${titleFontSize}px san-serif`;
        ctx.textBaseline = "middle";
        
        ctx.fillText(title, canvas.width / 2 - ctx.measureText(title).width / 2, barMarginBot + titleFontSize / 2);
    }

    // Create gradient
    const grd = ctx.createLinearGradient(0, barMarginTop + titleHeight, 0, barMarginTop + titleHeight + barHeight);
    grd.addColorStop(0, "#FF0000");
    grd.addColorStop(0.25, "#FFFF00");
    grd.addColorStop(0.5, "#00FF00");
    grd.addColorStop(0.75, "#00FFFF");
    grd.addColorStop(1, "#0000FF");

    ctx.fillStyle = grd;
    ctx.fillRect(barMarginLeft, barMarginTop + titleHeight, barWidth, barHeight);

    // Draw bar border    
    ctx.beginPath();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = "black";
    ctx.rect(barMarginLeft, barMarginTop + titleHeight, barWidth, barHeight);
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "#000000";
    ctx.font = `${fontSize}px san-serif`;
    ctx.textBaseline = "middle";

    const textLeft = barMarginLeft + barWidth + 15;
    for(let i = 0; i <= 1; i+=0.25) {
        ctx.beginPath();
        ctx.moveTo(barMarginLeft + barWidth, barMarginTop + titleHeight + barHeight * i);
        ctx.lineTo(barMarginLeft + barWidth + 5, barMarginTop + titleHeight + barHeight * i);
        ctx.stroke();

        ctx.fillText(Math.round(((minValue - maxValue) * i + maxValue + Number.EPSILON) * 100) / 100, 
        textLeft, barMarginTop + titleHeight + barHeight * i);
    }
}