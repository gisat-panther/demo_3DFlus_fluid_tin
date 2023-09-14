import { Layer } from '@deck.gl/core';
import { Model } from '@luma.gl/core';
import { Buffer } from '@luma.gl/webgl';

import { percentToHsl } from '../utils/ColorUtils';
import { getRelMovementRange } from '../utils/DataTransformUtils';

import { load } from '@loaders.gl/core';
import { ImageLoader } from '@loaders.gl/images';
import { Texture2D } from '@luma.gl/webgl';

import fragmentShader from './shaders/textureTriangles/fragment-shader.glsl';
import vertexShader from './shaders/textureTriangles/vertex-shader.glsl';


const defaultProps = {
    scale: {type: 'number', value: 1000},
    textureSize: {type: 'number', value: 1000},
}

export default class CustomTrianglesTexLayer extends Layer {

    initializeState(){
        const {gl} = this.context;

        const model = this.getModel(gl);
        this.setState({
            model: model,
        });

        load('textures/checker.png', [ImageLoader])
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


        const attributeManager = this.getAttributeManager();
        attributeManager.add({
            textureCoord: {size: 2, type: gl.FLOAT, update: this.getTextureCoordinates},
        });
    }

    getModel(gl){
        return new Model(gl, {
            vs: vertexShader,
            fs: fragmentShader,
            id: this.props.id,
            drawMode: gl.TRIANGLES
        });
    }

    getTextureCoordinates(attribute){ 
        const {data} = this.props;


        if(data.length > 0){
            
            let [minX,minY,maxX,maxY] = [Infinity,Infinity,-Infinity,-Infinity]

            data.forEach(element => {
                minX = Math.min(minX, element.coordinates[0]);
                minY = Math.min(minY, element.coordinates[1]);
                maxX = Math.max(maxX, element.coordinates[0]);
                maxY = Math.max(maxY, element.coordinates[1]);   
            });

            let regionSize = (maxX-minX) > (maxY - minY) ? (maxX-minX) : (maxY - minY);

            const textureCoordBuffer = new Float32Array(data.length * 2);
            let {textureSize} = this.props

          
            data.forEach((element, index) => {
                let position = element.coordinates;
    
                let textureX = (position[0]-minX)*(textureSize)/(regionSize)
                let textureY = (position[1]-minY)*(textureSize)/(regionSize)

                textureCoordBuffer[index * 2 + 0] = textureX;
                textureCoordBuffer[index * 2 + 1] = textureY;
            });

            attribute.value = textureCoordBuffer;
        }
    }

    updateState({oldProps, props, changeFlags}) {
        super.updateState({props, oldProps, changeFlags});
        
        if(changeFlags.dataChanged) {
            const {data} = this.props;
            const {model} = this.state;

            model.vertexCount = data.length;
            const {maxAbsValue} = getRelMovementRange(data);
            this.setState({
                maxAbsValue:maxAbsValue,
            });
        }

        if(props.textureSize !== oldProps.textureSize){
            const attributeManager = this.getAttributeManager();
            attributeManager.invalidate("textureCoord");
        }
    }

    updateBuffers() {
        const {gl} = this.context;
        const {model} = this.state;
        const {data, scale, valueBuffer} = this.props;
        const maxAbsValue = this.state.maxAbsValue;

        if (valueBuffer.length > 0 && model && data.length > 0) {
          
            let color = [0.5, 0.5, 0.5];
            const colorBuffer = new Float32Array(data.length * 3);
            const positionBuffer = new Float32Array(data.length * 3);

           
            data.forEach((item, index) => {       
                const percentValue = Math.abs(valueBuffer[index]) / maxAbsValue;
                if(percentValue){
                    color = percentToHsl(percentValue);
                }
           
                colorBuffer[index * 3 + 0] = color[0];
                colorBuffer[index * 3 + 1] = color[1];
                colorBuffer[index * 3 + 2] = color[2];
            
                positionBuffer[index * 3 + 0] = data[index].coordinates[0];
                positionBuffer[index * 3 + 1] = data[index].coordinates[1];
                positionBuffer[index * 3 + 2] = 1000+valueBuffer[index]*scale/1000;  
            });
                      
            const colorLocation = gl.getAttribLocation(model.getProgram().handle, 'color');
            model.vertexArray.setBuffer(colorLocation, new Buffer(gl, {
                usage: gl.DYNAMIC_DRAW,
                data: colorBuffer
            }));
                
            const positionLocation = gl.getAttribLocation(model.getProgram().handle, 'position');
            model.vertexArray.setBuffer(positionLocation, new Buffer(gl, {
                usage: gl.DYNAMIC_DRAW,
                data: positionBuffer,
            }));
        }
    }
   
    draw(){
        const {model} = this.state;

        this.updateBuffers();
        this.setNeedsRedraw();

        if(model) {
            model.draw();
        }
    }
}

CustomTrianglesTexLayer.layerName = 'CustomTrianglesTexLayer';
CustomTrianglesTexLayer.defaultProps = defaultProps;