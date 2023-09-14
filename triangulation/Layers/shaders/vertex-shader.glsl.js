export default `
attribute vec3 position;
attribute vec4 color;

varying vec4 vColor;

void main() {
    vColor = color;
    gl_Position = project_common_position_to_clipspace(project_position(vec4(position, 1)));
}
`;