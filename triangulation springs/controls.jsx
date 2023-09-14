import React, { useState}  from 'react';

export function Controls(props){

    const [wasAnimationOn, setWasAnimationOn] = useState(true)

    return (
        <div style={{
            position: "absolute", zIndex: 1,
            background: "white",
            boxShadow: "5px 5px 5px 5px rgba(0, 0, 0, 0.2)",
            margin: "10px",
            padding: "5px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>

            <button
                style={{ margin: "5px",fontSize: "20px",  fontWeight: "bold", color: "white",   border: "none", 
                backgroundColor: wasAnimationOn ? 'grey' : 'RoyalBlue',
                cursor: "pointer"
                }}
                onClick={ () =>  
                {
                    setWasAnimationOn(!props.isAnimationOn)
                    return props.setAnimation(!props.isAnimationOn)
                }}
            >
               {wasAnimationOn ? 'Stop' : 'Start'}
            </button>
            <input
                style={{ width: '100%', cursor: "pointer", backgroundColor: "white" }}
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
                onMouseUp={ () => props.setAnimation(wasAnimationOn)}
                />
            <h3>{  new Date(props.time).toLocaleDateString("cs-CZ")} </h3>

            <h3>Deformation scale</h3>
            <input
                style={{ width: '100%', cursor: "pointer", backgroundColor: "white" }}
                type="range"
                min="0"
                max="5000"
                step="100"
                value={props.scale}
                onChange={(e) => { props.setScale( e.target.value === "0" ? 1 : Number(e.target.value))}}
                />
            <h3>1 : {props.scale}</h3>
        </div>
        
    )
}