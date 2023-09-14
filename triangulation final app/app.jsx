import DeckGL from '@deck.gl/react';

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StaticMap } from 'react-map-gl';

import { load } from '@loaders.gl/core';
import { JSONLoader } from '@loaders.gl/json';

import CustomLinesLayer from './Layers/CustomLinesLayer';
import CustomSpringsLayer from './Layers/CustomSpringsLayer';
import CustomTrianglesLayer from './Layers/CustomTrianglesLayer';
import CustomTrianglesTexLayer from './Layers/CustomTrianglesTexLayer';

import { drawLegend, getValuesRange } from './utils/ColorUtils';
import { createValueBuffer, getTimeRange, transformData } from './utils/DataTransformUtils';
import { createLinesFeatures, createLinesIndexes, createTrianglesFeatures, getTrianglesIndexes } from './utils/TriangulationUtils';

import { Controls } from '/controls.jsx';

const DATA_SOURCE = 'data/drr_wbbhu_114_ps_los.json';
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
const INITIAL_VIEW_STATE = {
  latitude: 27.454355,
  longitude: 90.449541,
  zoom: 14,
  bearing: 0,
  pitch: 30
};

export default function App({data,minTime,maxTime,trianglesIndexes, trianglesData, linesData, linesIndexes}) {

  //controls values
  const [time, setTime] = useState(minTime);
  const [scale, setScale] = useState(1000);
  const [textureSize, setTextureSize] = useState(100);
  const [springLength, setSpringLength] = useState(0.0001);

  //buffers
  const [valueBuffer, setValueBuffer] = useState(new Float32Array());
  const [triangleBuffer, setTriangleBuffer] = useState(new Float32Array());
  const [linesBuffer, setLinesBuffer] = useState(new Float32Array());

  //layers visiblity values
  const [showLinesLayer, setShowLinesLayer] = useState(true);
  const [showTriTexLayer, setShowTriTexLayer] = useState(true);
  const [showTriLayer, setShowTriLayer] = useState(false);
  const [showSpringsLayer, setShowSpringsLayer] = useState(false);

  //animation
  //https://css-tricks.com/using-requestanimationframe-with-react-hooks/
  const frame = useRef(0);
  const [isAnimationOn, setAnimation] = useState(true);
  const animationStep = 100000000;
  const animate = () => {
    setTime(t => (maxTime < t) ? minTime : (t + animationStep));
    frame.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if(isAnimationOn){
      frame.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(frame.current);
  }, [isAnimationOn]);

  //calculate buffers when time changes
  useEffect(() => {
    //calculate value buffer for the current time
    setValueBuffer(createValueBuffer(data, time))

    if(valueBuffer){
      //assign calculated values to tri and line buffers according to the indexes
      const bufferTri = new Float32Array(trianglesIndexes.length);
      trianglesIndexes.forEach((featureIndex, index) => {
        bufferTri[index] = valueBuffer[featureIndex]
      });
      setTriangleBuffer(bufferTri);

      const bufferLine = new Float32Array(linesIndexes.length);
      linesIndexes.forEach((featureIndex, index) => {
        bufferLine [index] = valueBuffer[featureIndex]
      });
      setLinesBuffer(bufferLine);
   }

  },[time]);

  //layers init
  const layers = [
    new CustomTrianglesTexLayer({
      id: 'customTrianglesTex',
      data: trianglesData,
      scale: scale,
      textureSize: textureSize,
      valueBuffer: triangleBuffer,
      getPolygonOffset: () => [0, 20000000],
      visible: showTriTexLayer
    }),

    new CustomTrianglesLayer({
      id: 'customTriangles',
      data: trianglesData,
      scale: scale,
      valueBuffer: triangleBuffer,
      getPolygonOffset: () => [0, 20000000],
      visible: showTriLayer
    }),
    
    new CustomLinesLayer({
      id: 'customLines',
      data: linesData,
      scale: scale,
      valueBuffer: linesBuffer,
      getPolygonOffset: () => [0, 0],
      visible: showLinesLayer
    }),

    new CustomSpringsLayer({
      id: 'customSprings',
      data: linesData,
      scale: scale,
      valueBuffer: linesBuffer,
      springLength: springLength,
      parameters: {
        depthTest: false
      },
      visible: showSpringsLayer
    }),
  ];
 
  return (
    <div>
      <DeckGL layers={layers} initialViewState={INITIAL_VIEW_STATE} controller={true}>
        <StaticMap mapStyle={MAP_STYLE} />
      </DeckGL>
      <Controls
        props = {{
          isAnimationOn, setAnimation,
          minTime, maxTime, time, textureSize, springLength,
          scale, setScale, setTime, setTextureSize, setSpringLength,
          setShowLinesLayer, setShowTriTexLayer, setShowTriLayer, setShowSpringsLayer,
          showLinesLayer, showTriTexLayer, showTriLayer, showSpringsLayer, 
        }}
      />
    </div>
  );
}

export function renderToDOM(container) {
  //load data from GeoJSON
  load(DATA_SOURCE, JSONLoader).then(data =>{
    //draw legend
    const propName = 'vel_cum';
    const {minAbsValue, maxAbsValue} = getValuesRange(data.features, propName);
    drawLegend(minAbsValue, maxAbsValue, propName);

    //get timestamps and interpolate missing values
    return transformData(data.features)
  }).then(data =>{
    const {minTime, maxTime} = getTimeRange(data);

    //triangulate data
    const trianglesData = createTrianglesFeatures(data);
    const trianglesIndexes = getTrianglesIndexes(data);
    const linesData = createLinesFeatures(trianglesData)
    const linesIndexes = createLinesIndexes(trianglesIndexes)
    
    //render
    return createRoot(container).render(
      <App {...{data, minTime, maxTime, trianglesData, trianglesIndexes, linesData, linesIndexes}}/> 
    )

  })
 
}
