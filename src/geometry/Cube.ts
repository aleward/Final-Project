import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  constructor(center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
  }

  create() {

  this.indices = new Uint32Array([0, 1, 2, 0, 2, 3,       //front
                                  4, 5, 6, 4, 6, 7,       //right
                                  8, 9, 10, 8, 10, 11,    //upper
                                  12, 13, 14, 12, 14, 15, //left
                                  16, 17, 18, 16, 18, 19, //lower
                                  20, 21, 22, 20, 22, 23]);//back
  this.normals = new Float32Array([// front quad          
                                    0, 0, 1, 0, 
                                    0, 0, 1, 0, 
                                    0, 0, 1, 0, 
                                    0, 0, 1, 0, 
                                    // right quad          
                                    1, 0, 0, 0, 
                                    1, 0, 0, 0, 
                                    1, 0, 0, 0, 
                                    1, 0, 0, 0, 
                                    // upper quad          
                                    0, 1, 0, 0, 
                                    0, 1, 0, 0, 
                                    0, 1, 0, 0, 
                                    0, 1, 0, 0, 
                                    // left quad           
                                    -1, 0, 0, 0,
                                    -1, 0, 0, 0,
                                    -1, 0, 0, 0,
                                    -1, 0, 0, 0,
                                    // lower quad          
                                    0, -1, 0, 0,
                                    0, -1, 0, 0,
                                    0, -1, 0, 0,
                                    0, -1, 0, 0,
                                    // back quad           
                                    0, 0, -1, 0,
                                    0, 0, -1, 0,
                                    0, 0, -1, 0,
                                    0, 0, -1, 0]);
  this.positions = new Float32Array([//front quad
                                    -1, -1, 1, 1, //0
                                    1, -1, 1, 1,  //1
                                    1, 1, 1, 1,   //2
                                    -1, 1, 1, 1,  //3
                                    // right quad
                                    1, 1, 1, 1,   //4
                                    1, 1, -1, 1,  //5
                                    1, -1, -1, 1, //6
                                    1, -1, 1, 1,  //7
                                    // upper quad
                                    1, 1, 1, 1,   //8
                                    1, 1, -1, 1,  //9
                                    -1, 1, -1, 1, //10
                                    -1, 1, 1, 1,  //11
                                    // left quad
                                    -1, 1, 1, 1,  //12
                                    -1, 1, -1, 1, //13
                                    -1, -1, -1, 1,//14
                                    -1, -1, 1, 1, //15
                                    // lower quad
                                    -1, -1, 1, 1, //16
                                    -1, -1, -1, 1,//17
                                    1, -1, -1, 1, //18
                                    1, -1, 1, 1,  //19
                                    // back quad
                                    -1, -1, -1, 1,//20
                                    1, -1, -1, 1, //21
                                    1, 1, -1, 1,  //22
                                    -1, 1, -1, 1]);//23

    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created cube`);
  }
};

export default Cube;
