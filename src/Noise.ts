import {vec2, vec3} from 'gl-matrix';
import {mat4, vec4} from 'gl-matrix';
import {gl} from './globals';

// Adapted from "Simplex 3D Noise" by Ian McEwan, Ashima Arts:
export class Noise {

    constructor() {
        
    }

    permute(x: vec4): vec4 {
        return vec4.fromValues(((x[0] * 34 + 1) * x[0]) % 289, 
                               ((x[1] * 34 + 1) * x[1]) % 289,
                               ((x[2] * 34 + 1) * x[2]) % 289,
                               ((x[3] * 34 + 1) * x[3]) % 289);
    }
    taylorInvSqrt(r: vec4): vec4 {
        return vec4.fromValues(1.79284291400159 - 0.85373472095314 * r[0],
                               1.79284291400159 - 0.85373472095314 * r[1],
                               1.79284291400159 - 0.85373472095314 * r[2],
                               1.79284291400159 - 0.85373472095314 * r[3]);
    }

    dot(a: vec3, b: vec3): number {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    step(a: number, b: number): number {
        if (b < a) {
            return 0;
        } else {
            return 1;
        }
    }

    snoise(v: vec3): number{ 
        const C: vec2 = vec2.fromValues(1.0/6.0, 1.0/3.0) ;
        const D: vec4 = vec4.fromValues(0, 0.5, 1, 2);
      
      // First corner
        let dot1: number = this.dot(v, vec3.fromValues(C[1], C[1], C[1]));
        let i: vec3 = vec3.fromValues(Math.floor(v[0] + dot1), 
                                      Math.floor(v[1] + dot1), 
                                      Math.floor(v[2] + dot1));

        let dot2: number = this.dot(i, vec3.fromValues(C[0], C[0], C[0]));
        let x0: vec3 =  vec3.fromValues(v[0] - i[0] + dot2,
                                        v[1] - i[1] + dot2,
                                        v[2] - i[2] + dot2);
      
      // Other corners
        let g: vec3 = vec3.fromValues(this.step(x0[1], x0[0]),
                                      this.step(x0[2], x0[1]), 
                                      this.step(x0[0], x0[2]));
        let l: vec3 = vec3.fromValues(1.0 - g[0], 1.0 - g[1], 1.0 - g[2]);
        let i1: vec3 = vec3.fromValues(Math.min(g[0], l[2]),
                                       Math.min(g[1], l[0]),
                                       Math.min(g[2], l[1]));
        let i2: vec3 = vec3.fromValues(Math.max(g[0], l[2]),
                                       Math.max(g[1], l[0]),
                                       Math.max(g[2], l[1]));
      
        //  x0 = x0 - 0. + 0.0 * C 
        let x1: vec3 = vec3.fromValues(x0[0] - i1[0] + 1 * C[0],
                                       x0[1] - i1[1] + 1 * C[0],
                                       x0[2] - i1[2] + 1 * C[0]);
        let x2: vec3 = vec3.fromValues(x0[0] - i2[0] + 2 * C[0],
                                       x0[1] - i2[1] + 2 * C[0],
                                       x0[2] - i2[2] + 2 * C[0]);
        let x3: vec3 = vec3.fromValues(x0[0] - 1 + 3 * C[0],
                                       x0[1] - 1 + 3 * C[0],
                                       x0[2] - 1 + 3 * C[0]);
      
      // Permutations
        i = vec3.fromValues(i[0] % 289.0, i[2] % 289.0, i[2] % 289.0); 
        let temp: vec4 = vec4.fromValues(i[2], i[2] + i1[2], i[2] + i2[2], i[2] + 1.0);
        temp = this.permute(temp);
        vec4.add(temp, temp, vec4.fromValues(i[1], i[1] + i1[1], i[1] + i2[1], i[1] + 1.0));
        temp = this.permute(temp);
        vec4.add(temp, temp, vec4.fromValues(i[0], i[0] + i1[0], i[0] + i2[0], i[0] + 1.0));
        let p: vec4 = this.permute(temp);
      
      // Gradients
      // ( N*N points uniformly over a square, mapped onto an octahedron.)
        let n_: number = 1.0 / 7.0; // N=7
        let ns: vec3 = vec3.fromValues(n_ * D[3] - D[0],
                                       n_ * D[1] - D[2],
                                       n_ + D[2] - D[0]);
      
        let j: vec4 = vec4.fromValues(p[0] - 49.0 * Math.floor(p[0] * ns[2] * ns[2]), 
                                      p[1] - 49.0 * Math.floor(p[1] * ns[2] * ns[2]), 
                                      p[2] - 49.0 * Math.floor(p[2] * ns[2] * ns[2]),
                                      p[3] - 49.0 * Math.floor(p[3] * ns[2] * ns[2]));  //  mod(p,N*N)
      
        let x_: vec4 = vec4.fromValues(Math.floor(j[0] * ns[2]),
                                       Math.floor(j[1] * ns[2]),
                                       Math.floor(j[2] * ns[2]),
                                       Math.floor(j[3] * ns[2]));
        let y_: vec4 = vec4.fromValues(Math.floor(j[0] - 7 * x_[0]),
                                       Math.floor(j[1] - 7 * x_[1]),
                                       Math.floor(j[2] - 7 * x_[2]),
                                       Math.floor(j[3] - 7 * x_[3]));    // mod(j,N)
      
        let x: vec4 = vec4.fromValues(x_[0] * ns[0] + ns[1],
                                      x_[1] * ns[0] + ns[1],
                                      x_[2] * ns[0] + ns[1],
                                      x_[3] * ns[0] + ns[1]);
        let y: vec4 = vec4.fromValues(y_[0] * ns[0] + ns[1],
                                      y_[1] * ns[0] + ns[1],
                                      y_[2] * ns[0] + ns[1],
                                      y_[3] * ns[0] + ns[1]);
        let h: vec4 = vec4.fromValues(1.0 - Math.abs(x[0]) - Math.abs(y[0]), 
                                      1.0 - Math.abs(x[1]) - Math.abs(y[1]), 
                                      1.0 - Math.abs(x[2]) - Math.abs(y[2]), 
                                      1.0 - Math.abs(x[3]) - Math.abs(y[3]));
      
        let b0: vec4 = vec4.fromValues(x[0], x[1], y[0], y[1]);
        let b1: vec4 = vec4.fromValues(x[2], x[3], y[2], y[3]);
      
        let s0: vec4 = vec4.fromValues(Math.floor(b0[0] * 2 + 1),
                                       Math.floor(b0[1] * 2 + 1),
                                       Math.floor(b0[2] * 2 + 1),
                                       Math.floor(b0[3] * 2 + 1));
        let s1: vec4 = vec4.fromValues(Math.floor(b1[0] * 2 + 1),
                                       Math.floor(b1[1] * 2 + 1),
                                       Math.floor(b1[2] * 2 + 1),
                                       Math.floor(b1[3] * 2 + 1));
        let sh: vec4 = vec4.fromValues(-this.step(h[0], 0),
                                       -this.step(h[1], 0), 
                                       -this.step(h[2], 0),
                                       -this.step(h[3], 0));

        let a0: vec4 = vec4.fromValues(b0[0] + s0[0] * sh[0],
                                       b0[2] + s0[2] * sh[0],
                                       b0[1] + s0[1] * sh[1],
                                       b0[3] + s0[3] * sh[1]);
        let a1: vec4 = vec4.fromValues(b1[0] + s1[0] * sh[2],
                                       b1[2] + s1[2] * sh[2],
                                       b1[1] + s1[1] * sh[3],
                                       b1[3] + s1[3] * sh[3]);
      
        let p0: vec3 = vec3.fromValues(a0[0], a0[1], h[0]);
        let p1: vec3 = vec3.fromValues(a0[2], a0[3], h[1]);
        let p2: vec3 = vec3.fromValues(a1[0], a1[1], h[2]);
        let p3: vec3 = vec3.fromValues(a1[2], a1[3], h[3]);
      
      //Normalise gradients
        let norm: vec4 = this.taylorInvSqrt(vec4.fromValues(this.dot(p0, p0), this.dot(p1, p1), this.dot(p2, p2), this.dot(p3, p3)));
        vec3.multiply(p0, p0, vec3.fromValues(norm[0], norm[0], norm[0]));
        vec3.multiply(p1, p1, vec3.fromValues(norm[1], norm[1], norm[1]));
        vec3.multiply(p2, p2, vec3.fromValues(norm[2], norm[2], norm[2]));
        vec3.multiply(p3, p3, vec3.fromValues(norm[3], norm[3], norm[3]));
      
      // Mix final noise value
        let m: vec4 = vec4.fromValues(Math.max(0.6 - this.dot(x0,x0), 0), 
                                      Math.max(0.6 - this.dot(x1,x1), 0), 
                                      Math.max(0.6 - this.dot(x2,x2), 0), 
                                      Math.max(0.6 - this.dot(x3,x3), 0));
        m = vec4.fromValues(m[0] * m[0], m[1] * m[1], m[2] * m[2], m[3] * m[3]);
        let mTemp = this.dot(vec3.fromValues(m[0] * m[0], m[1] * m[1], m[2] * m[2]), 
                             vec3.fromValues(this.dot(p0,x0), this.dot(p1,x1), this.dot(p2,x2)))
                             + m[3] * m[3] * this.dot(p3,x3);
        return 42.0 * mTemp;
      }
}