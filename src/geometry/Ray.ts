import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
import {Shape} from '../Shape';

class Ray extends Drawable {
    static ray: Shape = new Shape("ray.obj", 1);
    indices: number[] = [];//Uint32Array;
    positions: number[] = []; //Float32Array;
    normals: number[] = []; //Float32Array;
    colors: number[] = []; //Float32Array;
    center: vec4;

    origS: number = 15;
    origF: number = 7;

    end: vec3;
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
        this.changedX = 0;
        this.changedZ = 0;
        this.end = end;

        this.lowA = 0.05;
        this.upA = 0.1;

        this.r = 206 / 255;
        this.g = 230 / 255;
        this.b = 255 / 255;
    }

    create() {

        for (let j = 0; j < Ray.ray.norms.length; j += 3) {
            this.normals.push(Ray.ray.norms[j]);
            this.normals.push(Ray.ray.norms[j + 1]);
            this.normals.push(Ray.ray.norms[j + 2]);
            this.normals.push(0.0);
        }

        for (let j = 0; j < Ray.ray.pos.length; j += 3) {
            let y = Ray.ray.pos[j + 1];

            this.colors.push(206 / 255.0);
            this.colors.push(230 / 255.0);
            this.colors.push(255 / 255.0);

            if (y > -0.2) {
                this.colors.push(1.0);

                this.positions.push(Ray.ray.pos[j] * this.origF + this.changedX);
                this.positions.push(this.startY);
                this.positions.push(Ray.ray.pos[j + 2] * this.origS + this.changedZ);
                this.positions.push(1.0);
            } else {
                this.colors.push(1.0);

                this.positions.push(Ray.ray.pos[j] * this.origF + this.end[0]);
                this.positions.push(this.end[1]);
                this.positions.push(Ray.ray.pos[j + 2] * this.origS + this.end[2]);
                this.positions.push(1.0);
            }
        }

        let indc: Uint32Array = new Uint32Array(Ray.ray.idx);
        let posit: Float32Array = new Float32Array(this.positions);
        let norms: Float32Array = new Float32Array(this.normals);
        let cols: Float32Array = new Float32Array(this.colors);

        this.generateIdx();
        this.generatePos();
        this.generateNor();
        this.generateCol(); 

        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indc, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
        gl.bufferData(gl.ARRAY_BUFFER, norms, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, posit, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
        gl.bufferData(gl.ARRAY_BUFFER, cols, gl.STATIC_DRAW);

        console.log(`Created ray`);
        console.log("indx");
        console.log(indc);
        console.log("pos");
        console.log(posit);
        console.log("n");
        console.log(norms);
        console.log("c");
        console.log(cols);
    }
};

export default Ray;
