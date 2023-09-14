import { Layer } from '@deck.gl/core';
import { Model } from '@luma.gl/core';
import { Buffer } from '@luma.gl/webgl';

import fragmentShader from './shaders/lines/fragment-shader.glsl';
import vertexShader from './shaders/lines/vertex-shader.glsl';


const defaultProps = {
    scale: {type: 'number', value: 1000},
    getColor: {type: "accessor", value: () => [0.0, 0.0, 0.9]}
}

export default class CustomLinesLayer extends Layer {

    initializeState(){
        const {gl} = this.context;

        const model = this.getModel(gl);
        this.setState({
            model: model,
        });

        const attributeManager = this.getAttributeManager();
        attributeManager.add({
            color: {size: 3, accessor: 'getColor'},
        });

    }

    getModel(gl){
        return new Model(gl, {
            vs: vertexShader,
            fs: fragmentShader,
            id: this.props.id,
            drawMode: gl.LINES
        });
    }

    updateState({oldProps, props, changeFlags}) {
        super.updateState({props, oldProps, changeFlags});
        
        if(changeFlags.dataChanged) {
            const {data} = this.props;
            const {model} = this.state;

            model.vertexCount = data.length;
        }
    }

    updateBuffers() {
        const {gl} = this.context;
        const {model} = this.state;
        const {data, scale, valueBuffer} = this.props;
        
        if (model && data.length > 0 && valueBuffer.length > 0) {        
            const positionBuffer = new Float32Array(data.length * 3);

            data.forEach((item, index) => {       
                positionBuffer[index * 3 + 0] = data[index].coordinates[0];
                positionBuffer[index * 3 + 1] = data[index].coordinates[1];
                positionBuffer[index * 3 + 2] = 1000+valueBuffer[index]*scale/1000;  
            });

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

CustomLinesLayer.layerName = 'CustomLinesLayer';
CustomLinesLayer.defaultProps = defaultProps;