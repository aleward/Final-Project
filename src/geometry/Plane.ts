import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Plane extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  isColor: boolean;
  center: vec4;
  size: number;

  constructor(center: vec3, size: number) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.size = size;
    this.isColor = false;
  }

  addColors(colorArray: Float32Array) {
    this.colors = colorArray;
    this.isColor = true;
  }

  create() {

  this.indices = new Uint32Array([0, 1, 2,
                                  0, 2, 3]);
  this.normals = new Float32Array([0, 1, 0, 0,
                                   0, 1, 0, 0,
                                   0, 1, 0, 0,
                                   0, 1, 0, 0]);
  this.positions = new Float32Array([-1 * this.size + this.center[0], 0 + this.center[1], -1 * this.size + this.center[2], 1,
                                     1  * this.size + this.center[0], 0 + this.center[1], -1 * this.size + this.center[2], 1,
                                     1  * this.size + this.center[0], 0 + this.center[1],  1 * this.size + this.center[2], 1,
                                     -1 * this.size + this.center[0], 0 + this.center[1],  1 * this.size + this.center[2], 1]);

    this.generateIdx();
    this.generatePos();
    this.generateNor();
    if (this.isColor) { this.generateCol(); }

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    if (this.isColor) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
      gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
    }

    console.log(`Created plane`);
  }
};

export default Plane;
