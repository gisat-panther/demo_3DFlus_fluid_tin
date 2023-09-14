export default `
attribute vec3 position;
attribute vec2 textureCoord;
attribute vec3 color;

varying vec3 vColor;
varying vec2 vTexCoord;

void main() {
    vColor = color;
    vTexCoord = textureCoord;

    gl_Position = project_common_position_to_clipspace(project_position(vec4(position, 1.0)));
}
`;