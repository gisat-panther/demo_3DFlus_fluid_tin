export default `
uniform sampler2D uSampler;
varying vec2 vTexCoord;

varying vec3 vColor;

void main() {
    vec4 textureColor = texture2D(uSampler, vTexCoord);

    gl_FragColor = vec4( 
        min(1.0, vColor.x + textureColor.x), 
        min(1.0, vColor.y + textureColor.y), 
        min(1.0, vColor.z + textureColor.z), 
    0.7);
}
`;