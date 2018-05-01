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
    pos: vec3[] = [];

    constructor(file: string, scale: number) {
        // Reads the obj from index.html
        var OBJload = require('webgl-obj-loader');

        this.obj = document.getElementById(file).innerHTML;
        this.mesh = new OBJload.Mesh(this.obj);

        // The read in values:
        for (let i = 0; i < this.mesh.vertices.length; i+= 3) {
            this.pos.push(vec3.fromValues(this.mesh.vertices[i] * scale,
                                          this.mesh.vertices[i + 1] * scale,
                                          this.mesh.vertices[i + 2] * scale));
        }
    }
}