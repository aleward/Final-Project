import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class RayNvm extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  center: vec4;

  startY: number;
  changedX: number;
  changedZ: number;

  lowA: number;
  upA: number;

  r: number;
  g: number;
  b: number;

  constructor(center: vec3, startY: number, end: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.startY = startY;

    this.lowA = 0.05;
    this.upA = 0.1;

    this.r = 206 / 255;
    this.g = 230 / 255;
    this.b = 255 / 255;
  }

  create() {

  this.indices = new Uint32Array([0, 1, 2, 0, 2, 3,       //front
                                  4, 5, 6, 4, 6, 7,       //right
                                  //8, 9, 10, 8, 10, 11,    //upper
                                  8, 9, 10, 8, 10, 11,//12, 13, 14, 12, 14, 15, //left
                                  12, 13, 14, 12, 14, 15//16, 17, 18, 16, 18, 19, //lower
                                  //20, 21, 22, 20, 22, 23
                                ]);//back
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
                                    -1, -1, 1, 1, //0 //lower
                                    1, -1, 1, 1,  //1 //lower
                                    1, this.startY, 1, 1,   //2 //upper
                                    -1, this.startY, 1, 1,  //3 //upper
                                    // right quad
                                    1, this.startY, 1, 1,   //4 //upper
                                    1, this.startY, -1, 1,  //5 //upper
                                    1, -1, -1, 1, //6 //lower
                                    1, -1, 1, 1,  //7 //lower
                                    // // upper quad
                                    // 1, 1, 1, 1,   //8
                                    // 1, 1, -1, 1,  //9 
                                    // -1, 1, -1, 1, //10
                                    // -1, 1, 1, 1,  //11
                                    // left quad
                                    -1, this.startY, 1, 1,  //12 = 8 //upper
                                    -1, this.startY, -1, 1, //13 = 9 //upper
                                    -1, -1, -1, 1,//14 = 10 //lower
                                    -1, -1, 1, 1, //15 = 11 //lower
                                    // // lower quad
                                    // -1, -1, 1, 1, //16
                                    // -1, -1, -1, 1,//17
                                    // 1, -1, -1, 1, //18
                                    // 1, -1, 1, 1  //19
                                    // // back quad
                                    -1, -1, -1, 1,//20 = 12 //lower
                                    1, -1, -1, 1, //21 = 13 //lower
                                    1, 1, -1, 1,  //22 = 14 //upper
                                    -1, 1, -1, 1]);//23 = 15 //upper

  this.colors = new Float32Array([//front quad
                                    this.r, this.g, this.b, this.lowA, //0 //lower
                                    this.r, this.g, this.b, this.lowA, //1 //lower
                                    this.r, this.g, this.b, this.upA,  //2 //upper
                                    this.r, this.g, this.b, this.upA,  //3 //upper
                                    // right quad
                                    this.r, this.g, this.b, this.upA,  //4 //upper
                                    this.r, this.g, this.b, this.upA,  //5 //upper
                                    this.r, this.g, this.b, this.lowA, //6 //lower
                                    this.r, this.g, this.b, this.lowA, //7 //lower
                                    // left quad
                                    this.r, this.g, this.b, this.upA,  //12 = 8 //upper
                                    this.r, this.g, this.b, this.upA,  //13 = 9 //upper
                                    this.r, this.g, this.b, this.lowA, //14 = 10 //lower
                                    this.r, this.g, this.b, this.lowA, //15 = 11 //lower
                                    // back quad
                                    this.r, this.g, this.b, this.lowA, //20 = 12 //lower
                                    this.r, this.g, this.b, this.lowA, //21 = 13 //lower
                                    this.r, this.g, this.b, this.upA,  //22 = 14 //upper
                                    this.r, this.g, this.b, this.upA]);//23 = 15 //upper

    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateCol(); 

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

    console.log(`Created ray`);
  }
};

export default RayNvm;
