export default `
varying vec4 vColor;

void main() {
    gl_FragColor = vec4(vColor);
}
`;