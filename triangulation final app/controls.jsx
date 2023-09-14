import React, { useState } from 'react';

export function Controls({props}){

    const [wasAnimationOn, setWasAnimationOn] = useState(true)

    const checkboxStyle = { height: "20px", width: "20px","accentColor":"RoyalBlue"};
    const labelStyle = {display: "flex", alignItems:"center"}; 
    const rangeStyle = { width: '100%', cursor: "pointer", backgroundColor: "white", "accentColor":"RoyalBlue"}; 
    const buttonStyle = { margin: "5px",fontSize: "20px",  fontWeight: "bold", color: "white",   border: "none", cursor: "pointer",
    backgroundColor: wasAnimationOn ? 'grey' : 'RoyalBlue',
    }
    const spanStyle = { textAlign: "center" }
    const layersStyle = { display: "flex", flexDirection: "column", alignItems:"start"}
    const controlsStyle = {
        position: "absolute", zIndex: 1,
        background: "white",
        boxShadow: "5px 5px 5px 5px rgba(0, 0, 0, 0.2)",
        margin: "10px",
        padding: "5px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    }

    return (
        <div style={controlsStyle}>
            <button
                style={buttonStyle}
                onClick={() => {
                    setWasAnimationOn(!props.isAnimationOn)
                    return props.setAnimation(!props.isAnimationOn)
                }}
            >
               {wasAnimationOn ? 'Stop' : 'Start'}
            </button>
            <input
                style={rangeStyle}
                type="range"
                min={props.minTime}
                max={props.maxTime}
                step="100000000"
                value={props.time}
                onChange={(e) => { props.setTime(Number(e.target.value))}}
                onMouseDown={ () =>{
                    setWasAnimationOn(props.isAnimationOn)
                    return props.setAnimation(false)
                }  }
                onMouseUp={() => props.setAnimation(wasAnimationOn)}
                />
            <h3>{new Date(props.time).toLocaleDateString("cs-CZ")} </h3>

            <h3>Layers</h3>
            <div style={layersStyle}>
                <label style={labelStyle}>
                    <input style={checkboxStyle} type="checkbox" checked={props.showTriLayer} onChange={()=>props.setShowTriLayer(!props.showTriLayer)}/>
                    Triangles
                </label>
                <label style={labelStyle}>
                    <input style={checkboxStyle} type="checkbox" checked={props.showTriTexLayer} onChange={()=>props.setShowTriTexLayer(!props.showTriTexLayer)}/>
                    Triangles texture
                </label>
                <label style={labelStyle}>
                    <input style={checkboxStyle} type="checkbox" checked={props.showLinesLayer} onChange={()=>props.setShowLinesLayer(!props.showLinesLayer)}/>
                    Lines
                </label>
                <label style={labelStyle}>
                    <input style={checkboxStyle} type="checkbox" checked={props.showSpringsLayer} onChange={()=>props.setShowSpringsLayer(!props.showSpringsLayer)}/>
                    Springs
                </label>
            </div>

            {(props.showTriTexLayer || props.showTriLayer || props.showLinesLayer || props.showSpringsLayer) && <span  style={spanStyle}>
            <h3>Deformation scale</h3>
            <input
                style={rangeStyle}
                type="range"
                min="0"
                max="5000"
                step="100"
                value={props.scale}
                onChange={(e) => { props.setScale( e.target.value === "0" ? 1 : Number(e.target.value))}}
                />
            <h3>1 : {props.scale}</h3>
            </span>}

            {props.showTriTexLayer && <span  style={spanStyle}>
                <h3>Texture size</h3>
                <input
                    style={rangeStyle}
                    type="range"
                    min="0"
                    max="500"
                    step="1"
                    value={props.textureSize}
                    onChange={(e) => props.setTextureSize(e.target.value === "0" ? 1 : Number(e.target.value))}
                />
            <h3>{props.textureSize} x {props.textureSize}</h3>
            </span>}

            {props.showSpringsLayer && <span  style={spanStyle}>
                <h3>Spring length</h3>
                <input
                    style={rangeStyle}
                    type="range"
                    min="0.00005"
                    max="0.001"
                    step="0.00001"
                    value={props.springLength}
                    onChange={(e) => props.setSpringLength(Number(e.target.value))}
                />
            <h3>{props.springLength}</h3>
            </span>}
        </div>      
    )
}