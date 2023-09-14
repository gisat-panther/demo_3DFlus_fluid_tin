import { Layer } from '@deck.gl/core';
import { Model } from '@luma.gl/core';
import { Buffer } from '@luma.gl/webgl';


import { percentToHsl } from '../Utils/ColorUtils';
import { createValueBuffer, getRelMovementRange } from '../Utils/DataTransformUtils';

import { Texture2D } from '@luma.gl/webgl';
import { load } from '@loaders.gl/core';
import { ImageLoader } from '@loaders.gl/images';

import fragmentShader from './shaders/fragment-shader.glsl';
import vertexShader from './shaders/vertex-shader.glsl';


const defaultProps = {
    time: {type: 'number', value: 100000000},
    scale: {type: 'number', value: 1000}
}

export default class CustomSpringsLayer extends Layer {

    initializeState(){
        const {gl} = this.context;
 
        const model = this.getModel(gl);
        this.setState({
            model: model,
        });

        load('textures/spring.png', [ImageLoader])
        .then(image => {
            const texture = new Texture2D(gl, {
                data: image,
                parameters: {
                    [gl.TEXTURE_MAG_FILTER]: gl.NEAREST,
                    [gl.TEXTURE_MIN_FILTER]: gl.NEAREST
                }
            });
            model.uniforms.uSampler = texture;
            this.setNeedsRedraw();
        })
    }

    getModel(gl){
        return new Model(gl, {
            vs: vertexShader,
            fs: fragmentShader,
            id: this.props.id,

            drawMode: gl.TRIANGLES,
        });
    }
   
    getTextureCoordinates(positionsBuffer){ 

        const textureCoordBuffer = new Float32Array(positionsBuffer.length);

        for(let i = 0; i < textureCoordBuffer.length; i+=8){
                

            let position1 = [positionsBuffer[i], positionsBuffer[i+1]];
            let position2 = [positionsBuffer[i+4], positionsBuffer[i+5]];

            let vector = [position2[0]-position1[0], position2[1]-position1[1]];
            let vectorSize = Math.pow(Math.pow(vector[0], 2)+Math.pow(vector[1], 2), 0.5);

            let textureSize = vectorSize/0.0001;

            textureCoordBuffer[i+0] = 0.0;
            textureCoordBuffer[i+1] = 0.0;

            textureCoordBuffer[i+2] = 0.0;
            textureCoordBuffer[i+3] = 1.0;

            textureCoordBuffer[i+4] = textureSize;
            textureCoordBuffer[i+5] = 0.0;

            textureCoordBuffer[i+6] = textureSize;
            textureCoordBuffer[i+7] = 1.0;
        }

        const newTextureCoordBuffer = new Float32Array(this.props.data.length * 6);

        for(let i = 0; i < textureCoordBuffer.length; i+=8){
        
            newTextureCoordBuffer[i*1.5 + 0] = textureCoordBuffer[i];
            newTextureCoordBuffer[i*1.5 + 1] = textureCoordBuffer[i+1];

            newTextureCoordBuffer[i*1.5 + 2] = textureCoordBuffer[i+2];
            newTextureCoordBuffer[i*1.5 + 3] = textureCoordBuffer[i+3];

            newTextureCoordBuffer[i*1.5 + 4] = textureCoordBuffer[i+4];
            newTextureCoordBuffer[i*1.5 + 5] = textureCoordBuffer[i+5];

            newTextureCoordBuffer[i*1.5 + 6] = textureCoordBuffer[i+2];
            newTextureCoordBuffer[i*1.5 + 7] = textureCoordBuffer[i+3];

            newTextureCoordBuffer[i*1.5 + 8] = textureCoordBuffer[i+4];
            newTextureCoordBuffer[i*1.5 + 9] = textureCoordBuffer[i+5];

            newTextureCoordBuffer[i*1.5 + 10] = textureCoordBuffer[i+6];
            newTextureCoordBuffer[i*1.5 + 11] = textureCoordBuffer[i+7];
        };   
        return newTextureCoordBuffer;    
    }

    getPositions(data){ 
        if(data.length > 0){
            const positionsBuffer = new Float32Array(data.length * 4);

            for(let i = 0; i < data.length; i+=2){

            
                let position1 = data[i].coordinates;
                let position2 = data[i+1].coordinates;

                let vector = [-1*(position2[1]-position1[1]), position2[0]-position1[0]];

                let vectorSize = Math.pow(Math.pow(vector[0], 2)+Math.pow(vector[1], 2), 0.5);
        
                let scale = 0.00005/vectorSize;
                let recSize = [scale*vector[0], scale*vector[1]];

    
                let point1 = [position1[0]-recSize[0],position1[1]-recSize[1]]
                let point2 = [position1[0]+recSize[0], position1[1]+recSize[1]]
        
                let point3 = [position2[0]-recSize[0], position2[1]-recSize[1]]
                let point4 = [position2[0]+recSize[0], position2[1]+recSize[1]]

                let pointsCount = 4;

                positionsBuffer[i * pointsCount + 0] = point1[0];
                positionsBuffer[i * pointsCount + 1] = point1[1];

                positionsBuffer[i * pointsCount + 2] = point2[0];
                positionsBuffer[i * pointsCount + 3] = point2[1];

                positionsBuffer[i * pointsCount + 4] = point3[0];
                positionsBuffer[i * pointsCount + 5] = point3[1];

                positionsBuffer[i * pointsCount + 6] = point4[0];
                positionsBuffer[i * pointsCount + 7] = point4[1];
            }
        
            return positionsBuffer
        }
    }

    updateState({oldProps, props, changeFlags}) {
        super.updateState({props, oldProps, changeFlags});
        
        if(changeFlags.dataChanged) {
            const {data} = this.props;
            const {model} = this.state;

            model.vertexCount = data.length*3;
    
            const {maxAbsValue} = getRelMovementRange(data);
            const positionsBuffer = this.getPositions(data);

            this.setState({
                maxAbsValue: maxAbsValue,
                positionsBuffer: positionsBuffer,
                textureCoordBuffer: this.getTextureCoordinates(positionsBuffer),
            });
        }
    }

    updateBuffers(time){
        const {gl} = this.context;
        const {model} = this.state;
        const {data, scale} = this.props;
        const maxAbsValue = this.state.maxAbsValue;


        const oldPositionBuffer = this.state.positionsBuffer;
        const newPositionBuffer = new Float32Array(data.length * 9);

        let color1 = [1, 0, 0];
        let color2 = [0, 0, 1];

        const colorBuffer = new Float32Array(data.length * 9);
        const valueBuffer = createValueBuffer(data, time);


        for(let i = 0; i < data.length; i+=2){   

            const percentValue1 = Math.abs(valueBuffer[i]) / maxAbsValue;
            color1 = percentToHsl(percentValue1);

            const percentValue2 = Math.abs(valueBuffer[i+1]) / maxAbsValue;
            color2 = percentToHsl(percentValue2);

            let colorsCount = 9;

            colorBuffer[i * colorsCount + 0] = color1[0];
            colorBuffer[i * colorsCount + 1] = color1[1];
            colorBuffer[i * colorsCount + 2] = color1[2];

            colorBuffer[i * colorsCount + 3] = color1[0];
            colorBuffer[i * colorsCount + 4] = color1[1];
            colorBuffer[i * colorsCount + 5] = color1[2];

            colorBuffer[i * colorsCount + 6] = color2[0];
            colorBuffer[i * colorsCount + 7] = color2[1];
            colorBuffer[i * colorsCount + 8] = color2[2];

            colorBuffer[i * colorsCount + 9] = color1[0];
            colorBuffer[i * colorsCount + 10] = color1[1];
            colorBuffer[i * colorsCount + 11] = color1[2];

            colorBuffer[i * colorsCount + 12] = color2[0];
            colorBuffer[i * colorsCount + 13] = color2[1];
            colorBuffer[i * colorsCount + 14] = color2[2];

            colorBuffer[i * colorsCount + 15] = color2[0];
            colorBuffer[i * colorsCount + 16] = color2[1];
            colorBuffer[i * colorsCount + 17] = color2[2];

            let point1 = [oldPositionBuffer[i*4+0],oldPositionBuffer[i*4+1]]
            let point2 = [oldPositionBuffer[i*4+2],oldPositionBuffer[i*4+3]]
            let point3 = [oldPositionBuffer[i*4+4],oldPositionBuffer[i*4+5]]
            let point4 = [oldPositionBuffer[i*4+6],oldPositionBuffer[i*4+7]]


            let pointsCount = 9;

            newPositionBuffer[i * pointsCount + 0] = point1[0];
            newPositionBuffer[i * pointsCount + 1] = point1[1];
            newPositionBuffer[i * pointsCount + 2] = 200+valueBuffer[i]*scale/1000;

            newPositionBuffer[i * pointsCount + 3] = point2[0];
            newPositionBuffer[i * pointsCount + 4] = point2[1];
            newPositionBuffer[i * pointsCount + 5] = 200+valueBuffer[i]*scale/1000;

            newPositionBuffer[i * pointsCount + 6] = point3[0];
            newPositionBuffer[i * pointsCount + 7] = point3[1];
            newPositionBuffer[i * pointsCount + 8] = 200+valueBuffer[i+1]*scale/1000;


            newPositionBuffer[i * pointsCount + 9] = point2[0];
            newPositionBuffer[i * pointsCount + 10] = point2[1];
            newPositionBuffer[i * pointsCount + 11] = 200+valueBuffer[i]*scale/1000;

            newPositionBuffer[i * pointsCount + 12] = point3[0];
            newPositionBuffer[i * pointsCount + 13] = point3[1];
            newPositionBuffer[i * pointsCount + 14] = 200+valueBuffer[i+1]*scale/1000;

            newPositionBuffer[i * pointsCount + 15] = point4[0];
            newPositionBuffer[i * pointsCount + 16] = point4[1];
            newPositionBuffer[i * pointsCount + 17] = 200+valueBuffer[i+1]*scale/1000;

        };

 
        const posLocation = gl.getAttribLocation(model.getProgram().handle, 'position');
            model.vertexArray.setBuffer(posLocation, new Buffer(gl, {
                usage: gl.DYNAMIC_DRAW,
                data: newPositionBuffer
        }));

        const colorLocation = gl.getAttribLocation(model.getProgram().handle, 'color');
        model.vertexArray.setBuffer(colorLocation, new Buffer(gl, {
            usage: gl.DYNAMIC_DRAW,
            data: colorBuffer
        }));

        const textureCoordLocation = gl.getAttribLocation(model.getProgram().handle, 'textureCoord');
        model.vertexArray.setBuffer(textureCoordLocation, new Buffer(gl, {
            usage: gl.DYNAMIC_DRAW,
            data: this.state.textureCoordBuffer
        }));
    }
  
    
    draw(){
        const {model} = this.state;
        const currentTime = this.props.time;

        this.updateBuffers(currentTime);
        this.setNeedsRedraw();
 
        if(model) {
            model.draw();
        }
    }
}

CustomSpringsLayer.layerName = 'CustomSpringsLayer';
CustomSpringsLayer.defaultProps = defaultProps;