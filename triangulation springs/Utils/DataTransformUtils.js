export function transformData(data, randomTimeValues = false) {
  
    // Get all timestamps
    let timestampsSet = new Set();
  
    data.forEach(item => {
      for(const [propName, value] of Object.entries(item.properties)) {
  
        if (value !== null && propName.startsWith("d_")) {
          const year = new Number(propName.substring(2,6));
          const month = new Number(propName.substring(6,8));
          const day = new Number(propName.substring(8,10));
  
          const date = new Date(year, month - 1, day);
          const timestamp = date.getTime();
  
          timestampsSet.add(timestamp);
        }
      }
    });
  
    const timestamps = Array.from(timestampsSet);
    timestampsSet = null;
    timestamps.sort((a, b) => a - b);
  
    // Get data
    const transformedData = [];
  
    data.forEach(item => {
  
      let itemData = {
        id: item.properties.id,
        coordinates: item.geometry.coordinates,
        h: item.properties.h,
        relMovements: []
      };
  
      timestamps.forEach(timestamp => {
        const date = new Date(timestamp);
  
        const yearStr = `${date.getFullYear()}`;
        const monthStr = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`;
        const dayStr = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
        const value = item.properties[`d_${yearStr}${monthStr}${dayStr}`];
  
       
        itemData.relMovements.push({
          timestamp,
          value
        });
      });
      
      transformedData.push(itemData);
    });
  
    // Interpolate missing values
    transformedData.forEach(item => {
      item.relMovements.forEach((relMovement,index, array) => {
        if(relMovement.value === undefined || relMovement.value === null) {
          if(index === 0) {
            relMovement.value = array.find(m => m.value !== undefined && m.value !== null);
          } else if(index === array.length - 1) {
            relMovement.value = array.slice().reverse().find(m => m.value !== undefined && m.value !== null);
          } else {
            const left = array.slice(0,index).reverse().find(m => m.value !== undefined && m.value !== null);
            const right = array.slice(index + 1).find(m => m.value !== undefined && m.value !== null);
            relMovement.value = (right.value - left.value) / (right.timestamp - left.timestamp) * (relMovement.timestamp - left.timestamp) + left.value;
            
          }
        }
      });
    });
  
    return transformedData;
  }

  export function createValueBuffer(data, time){
    const valueBuffer = new Float32Array(data.length);

        if (time < data[0].relMovements[0].timestamp) {
                data.forEach((item, index) => {
                   valueBuffer[index] = item.relMovements[0].value;
                });
        } else if (data[0].relMovements[data[0].relMovements.length - 1].timestamp < time) {
                data.forEach((item, index) => {
                    valueBuffer[index] = item.relMovements[item.relMovements.length - 1].value;
                });
        } else {
            let prevIndex = 0;
            let nextIndex = data[0].relMovements.length - 1;
                
            // Bisection method
            while(nextIndex - prevIndex > 1) {
                let midIndex = Math.floor((prevIndex + nextIndex) / 2);

                let prevTime = data[0].relMovements[prevIndex].timestamp;
                let midTime = data[0].relMovements[midIndex].timestamp;
                let nextTime = data[0].relMovements[nextIndex].timestamp;

                if (prevTime <= time && time < midTime) {
                    nextIndex = midIndex;
                } else if (midTime <= time && time <= nextTime) {
                    prevIndex = midIndex;
                }
            }

            data.forEach((item, index) => {
                const prevTime = item.relMovements[prevIndex].timestamp;
                const nextTime = item.relMovements[nextIndex].timestamp;

                const prevValue = item.relMovements[prevIndex].value;
                const nextValue = item.relMovements[nextIndex].value;

                const value = (nextValue - prevValue) / (nextTime - prevTime) * (time - prevTime) + prevValue;
                valueBuffer[index] = value;
            });
        }

        return valueBuffer;
} 

export function getTimeRange(data) {
  let minTime, maxTime;

  data.forEach(element => {
      element.relMovements.forEach(relMovement => {
          const time = relMovement.timestamp;
      
          if (!minTime || time < minTime) {
              minTime = time;
          }

          if (!maxTime || maxTime < time) {
              maxTime = time;
          }
      });
  });

  return {minTime, maxTime};
}

export function getRelMovementRange(data) {
  let minValue, maxValue, minAbsValue, maxAbsValue;

  data.forEach(element => {
      element.relMovements.forEach(relMovement => {
          if (!minValue || relMovement.value < minValue) {
              minValue = relMovement.value;
          }
      
          if (!maxValue || maxValue < relMovement.value) {
              maxValue = relMovement.value;
          }

          if (!minAbsValue || Math.abs(relMovement.value) < minAbsValue) {
              minAbsValue = Math.abs(relMovement.value);
          }
      });
  });

  maxAbsValue = Math.max(Math.abs(minValue), Math.abs(maxValue));

  return { minValue, maxValue, minAbsValue, maxAbsValue };
}