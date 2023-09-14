export default `
uniform sampler2D uSampler;
varying vec2 vTexCoord;
varying vec3 vColor;

void main() {
    vec4 textureColor = texture2D(uSampler, vTexCoord);

    if(textureColor.x > 0.1){
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
        gl_FragColor = vec4( min(1.0, vColor.x), min(1.0, vColor.y), min(1.0, vColor.z), 1.0);
    }
}
`;