export function percentToHsl(percentage) {
    const hue0 = 240;
    const hue1 = 0;

    let hue = (percentage * (hue1 - hue0)) + hue0;
    
    return hslToRgb( hue , 1.0, 0.5);
}

export function hslToRgb(hue, saturation, lightness){
    if (hue < 0 || 360 < hue) {
        throw new Error("Invalid hue value");
    }

    if (saturation < 0 || 1 < saturation) {
        throw new Error("Invalid saturation value.");
    }

    if (lightness < 0 || 1 < lightness) {
        throw new Error("Invalid lightness value.");
    }

    const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1))
    const m = lightness - c / 2;

    let rgb;

    if (hue < 60) {
        rgb = [c + m, x + m, 0 + m];
    } else if (hue < 120) {
        rgb = [x + m, c + m, 0 + m];
    } else if (hue < 180) {
        rgb = [0 + m, c + m, x + m];
    } else if (hue < 240) {
        rgb = [0 + m, x + m, c + m];
    } else if (hue < 300) {
        rgb = [x + m, 0 + m, c + m];
    } else if (hue < 360) {
        rgb = [c + m, 0 + m, x + m];
    }

    return rgb;
}

export function getValuesRange(data, propertyName) {
    let minValue, maxValue, maxAbsValue, minAbsValue;
  
    data.forEach(element => {
      const value = element.properties[propertyName];
      if (value !== undefined && value !== null) {
        if (!minValue || value < minValue) {
          minValue = value;
        }
  
        if (!maxValue || maxValue < value) {
          maxValue = value;
        }
  
        if (!minAbsValue || Math.abs(value) < minAbsValue) {
          minAbsValue = Math.abs(value);
        }
      }
    });
  
    maxAbsValue = Math.max(Math.abs(minValue), Math.abs(maxValue));
  
    return { minValue, maxValue, minAbsValue, maxAbsValue };
  }
  
  export function computeColors(data, minValue, maxValue, propertyName, transformValue){
    
    data.forEach(element => {
      const value = element.properties[propertyName];
      const percentValue = (transformValue(value) - minValue) / (maxValue - minValue);
      element.properties.color = percentToHsl(percentValue);
    });
  
    return data
  }


  export const drawLegend = function(minValue, maxValue, title) {

    const canvas = document.getElementById('legend');
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