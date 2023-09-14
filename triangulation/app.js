import { Deck } from '@deck.gl/core';
import { load } from '@loaders.gl/core';
import { JSONLoader } from '@loaders.gl/json';
import mapboxgl from 'mapbox-gl';

import CustomLinesLayer from './Layers/CustomLinesLayer';
import CustomTrianglesLayer from './Layers/CustomTrianglesLayer';

import { drawLegend } from './legend';
import { computeColors, getValuesRange } from './Utils/ColorUtils';

import { createTrianglesFeatures } from './Utils/TriangulationUtils';

const DATA_SOURCE = 'data/drr_wbbhu_114_ps_los.json';

const INITIAL_VIEW_STATE = {
  latitude: 27.454355,
  longitude: 90.449541,
  zoom: 14,
  bearing: 0,
  pitch: 30
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const map = new mapboxgl.Map({
  container: 'map',
  style: MAP_STYLE,
  // Note: deck.gl will be in charge of interaction and event handling
  interactive: false,
  center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
  zoom: INITIAL_VIEW_STATE.zoom,
  bearing: INITIAL_VIEW_STATE.bearing,
  pitch: INITIAL_VIEW_STATE.pitch
});


export const deck = new Deck({
  canvas: 'deck-canvas',
  width: '100%',
  height: '100%',
  initialViewState: INITIAL_VIEW_STATE,
  controller: true,
  onViewStateChange: ({viewState}) => {
    map.jumpTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      bearing: viewState.bearing,
      pitch: viewState.pitch
    });
  },
  layers: [
    new CustomTrianglesLayer({
      id: 'customTri',
      data: load(DATA_SOURCE, JSONLoader).then(data => createTrianglesFeatures(data)),
  
      dataTransform: data => 
      {
        const propName = 'vel_cum';
        const {minValue, maxValue, minAbsValue, maxAbsValue} = getValuesRange(data, propName);

        const legendParentDom = document.getElementById('legend');
        drawLegend(legendParentDom, minAbsValue, maxAbsValue, propName);

     
        return computeColors(data, minAbsValue, maxAbsValue, propName, v => Math.abs(v));
      },

      getPosition: item => [...item.geometry.coordinates,  0],
      getColor: item => [...item.properties.color,0.4]
    }),

    new CustomLinesLayer({
      id: 'customLines',

      data: load(DATA_SOURCE, JSONLoader).then(data =>{
       
        let features = [];
        let trianglePoints = createTrianglesFeatures(data);
      
        trianglePoints.forEach((feature, i) => { 
    
          switch ((i+1)%3) {
            case 1:
              features.push(feature)
              break;
            case 2:
              features.push(feature)
              features.push(feature) 
              break;
            case 0:
              features.push(feature)
              features.push(feature)
              features.push(trianglePoints[i-2])
              break;
            default:
              break;
          }
      
        });

        return features;
      } ),
      getPosition: item => [...item.geometry.coordinates, 0],
      getColor: [1,1,1,1]
    })
  ]
});
