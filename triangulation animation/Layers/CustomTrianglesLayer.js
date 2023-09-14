import { Layer } from '@deck.gl/core';
import { Model } from '@luma.gl/core';
import { Buffer } from '@luma.gl/webgl';

import fragmentShader from './shaders/fragment-shader.glsl';
import vertexShader from './shaders/vertex-shader.glsl';

import { percentToHsl } from '../Utils/ColorUtils';
import { createValueBuffer, getRelMovementRange } from '../Utils/DataTransformUtils';

const defaultProps = {
    time: {type: 'number', value: 100000000},
    scale: {type: 'number', value: 1000}
}

export default class CustomTrianglesLayer extends Layer {

    initializeState(){
        const {gl} = this.context;

        const model = this.getModel(gl);
        this.setState({
            model: model,
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

    updateState({oldProps, props, changeFlags}) {
        super.updateState({props, oldProps, changeFlags});
        
        if(changeFlags.dataChanged) {
            const {data} = this.props;
            const {model} = this.state;
      
            model.vertexCount = data.length;
            
            const {maxAbsValue} = getRelMovementRange(data);
            this.setState({
                maxAbsValue: maxAbsValue,
            });
        }
    }

    updateBuffers(time) {
        const {gl} = this.context;
        const {model} = this.state;
        const {data, scale} = this.props;
        const maxAbsValue = this.state.maxAbsValue;

        if (time && model && data.length > 0) {
          
            const valueBuffer = createValueBuffer(data, time);

            let color = [0.5, 0.5, 0.5];
            const colorBuffer = new Float32Array(data.length * 3);
            const positionBuffer = new Float32Array(data.length * 3);

           
            data.forEach((item, index) => {       
                const percentValue = Math.abs(valueBuffer[index]) / maxAbsValue;
           
                color = percentToHsl(percentValue);

                colorBuffer[index * 3 + 0] = color[0];
                colorBuffer[index * 3 + 1] = color[1];
                colorBuffer[index * 3 + 2] = color[2];
            
                positionBuffer[index * 3 + 0] = data[index].coordinates[0];
                positionBuffer[index * 3 + 1] = data[index].coordinates[1];
                positionBuffer[index * 3 + 2] = 200+valueBuffer[index]*scale/1000;  
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
        const currentTime = this.props.time;

        this.updateBuffers(currentTime);
        this.setNeedsRedraw();

        if(model) {
            model.draw();
        }
    }
}

CustomTrianglesLayer.layerName = 'CustomTrianglesLayer';
CustomTrianglesLayer.defaultProps = defaultProps;