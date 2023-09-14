import { Layer } from '@deck.gl/core';
import { Model } from '@luma.gl/core';

import vertexShader from './shaders/vertex-shader.glsl';
import fragmentShader from './shaders/fragment-shader.glsl';

const defaultProps = {
    getPosition: { type: "accessor", value: null },
    getColor: { type: "accessor", value: null }
}

export default class CustomLinesLayer extends Layer {
    initializeState(context){
        const {gl} = this.context;
        this.setState({
            model: this._getModel(gl)
        });

        const attributeManager = this.getAttributeManager();
        attributeManager.add({
            position: {size: 3, accessor: 'getPosition' },
            color: {size: 4, accessor: 'getColor'}
        });
    }

    _getModel(gl){
        return new Model(gl, {
            vs: vertexShader,
            fs: fragmentShader,
            id: this.props.id,
            drawMode: gl.LINES
        });
    }

    updateState({oldProps, props, changeFlags}) {
        super.updateState({props, oldProps, changeFlags});

        if(oldProps.data != props.data || oldProps.data.length != props.data.length){
            const {data} = this.props;
            const {model} = this.state;
            model.vertexCount = data.length;
        }
    }

    draw() {
        const {model} = this.state;
        model.draw();
    }

}

CustomLinesLayer.layerName = 'CustomLinesLayer';
CustomLinesLayer.defaultProps = defaultProps;