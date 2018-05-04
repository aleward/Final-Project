import {vec3} from 'gl-matrix';

/* Alexis Ward
 * id: aleward
 * CIS 566 
 * 
 * Uses WebGL to load objs for each needed shape
 */ 

export class Shape {
    // Variables to read mesh
    obj: string;
    mesh: any;

    // Values for the future VBO
    pos: number[] = [];
    norms: number[] = [];
    idx: number[] = [];

    constructor(file: string, scale: number) {
        // Reads the obj from index.html
        var OBJload = require('webgl-obj-loader');

        this.obj = document.getElementById(file).innerHTML;
        this.mesh = new OBJload.Mesh(this.obj);

        // The read in values:
        this.pos = this.mesh.vertices;
        this.norms = this.mesh.vertexNormals;
        this.idx = this.mesh.indices;
    }
}