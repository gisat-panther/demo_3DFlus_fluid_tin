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
