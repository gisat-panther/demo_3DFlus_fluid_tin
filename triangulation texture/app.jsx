import DeckGL from '@deck.gl/react';

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StaticMap } from 'react-map-gl';

import { load } from '@loaders.gl/core';
import { JSONLoader } from '@loaders.gl/json';

import CustomLinesLayer from './Layers/CustomLinesLayer';
import CustomTrianglesLayer from './Layers/CustomTrianglesLayer';

import { getTimeRange, transformData } from './Utils/DataTransformUtils';
import { createLinesFeatures, createTrianglesFeatures } from './Utils/TriangulationUtils';
import { drawLegend, getValuesRange } from './Utils/ColorUtils';

import { Controls } from '/controls.jsx';


const DATA_SOURCE = 'data/drr_wbbhu_114_ps_los.json';

const INITIAL_VIEW_STATE = {
  latitude: 27.454355,
  longitude: 90.449541,
  zoom: 14,
  bearing: 0,
  pitch: 30
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

export default function App({data, linesData}) {

  const {minTime, maxTime} = getTimeRange(data);
  const [time, setTime] = useState(minTime);

  const [scale, setScale] = useState(1000);

  const [animation] = useState({});
  const [isAnimationOn, setAnimation] = useState(true);

  const animationSpeed = 100000000;

  const animate = () => {

    setTime(t => {
      if (maxTime < t){
        return minTime;
      }
      return (t + animationSpeed)
    });

    animation.id = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    if(!isAnimationOn){
      window.cancelAnimationFrame(animation.id);
      return;
    }

    animation.id = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animation.id);
  }, [isAnimationOn]);


  const layers = [
 
    new CustomTrianglesLayer({
      id: 'customTriangles',
      data: data,
      time: time,
      scale: scale,
      getPolygonOffset: () => [0, 20000]
    }),
    
    new CustomLinesLayer({
      id: 'customLines',
      data: linesData,
      time: time,
      scale: scale,
      getPolygonOffset: () => [0, 0]
    }),
  ];
 

  return (
    <div>
    <DeckGL
      layers={layers}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
    >
    <StaticMap mapStyle={MAP_STYLE} />
      
    </DeckGL>
    <Controls
      isAnimationOn= {isAnimationOn}
      setAnimation = {setAnimation}
      minTime = {minTime}
      maxTime = {maxTime}
      time = {time}
      setTime = {setTime}
      scale = {scale}
      setScale = {setScale}
    />
    </div>
  );
}

export function renderToDOM(container) {

  load(DATA_SOURCE, JSONLoader).then(
    data => createTrianglesFeatures(data)).then(
      data =>{
        const propName = 'vel_cum';
        const {minAbsValue, maxAbsValue} = getValuesRange(data, propName);
        drawLegend(minAbsValue, maxAbsValue, propName);

        return transformData(data)
        }).then(
          data => createRoot(container).render(<App data={data} linesData = {createLinesFeatures(data)}/>))
}
