import {vec2, vec3, vec4} from 'gl-matrix';

/*
 *
 * 
 */ 

class Particle {
    orig: vec3;
    pos: vec3;
    vel: vec3;
    acc: vec3;

    offset: number;
    
    // Colors
    r: number = 255;
    g: number = 0;
    b: number = 0;

    // Mesh attributes
    isMesh: boolean;
    meshPos: vec3;

    static leftClick: boolean = false;
    static rightClick: boolean = false;
    static mouseLoc: vec3 = vec3.fromValues(5, 5, 0);
    static mouseVec: vec3 = vec3.fromValues(0, 0, 0);

    wasClicked: boolean = false;

    constructor(pos: vec3) {
        this.pos = pos;
        this.orig = pos;
        this.vel = vec3.fromValues(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        this.acc = vec3.fromValues(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);

        this.offset = Math.random();

        for (let i = 0; i < vec3.length(pos) * 4; i++) {
            this.colChange();
        }
    }

    setVals(time: number) {
        let timeVal = Math.sin(0.01 * (time) + this.offset) * 20;

        let change: vec3 = vec3.fromValues(0.01 * timeVal * (this.vel[0] + timeVal * this.acc[0]), 
                                            0.01 * timeVal * (this.vel[1] + timeVal * this.acc[1]), 
                                            0.01 * timeVal * (this.vel[2] + timeVal * this.acc[2]));
        
        let skip: boolean = false;

        let clickVal = vec3.fromValues(this.orig[0], this.orig[1], this.orig[2]);
        
        if (this.isMesh) {
            clickVal = vec3.fromValues(this.meshPos[0], this.meshPos[1], this.meshPos[2]);
        }
        
        if (Particle.leftClick) {
            vec3.subtract(clickVal, Particle.mouseLoc, this.pos);
            vec3.normalize(clickVal, clickVal);
            vec3.add(clickVal, this.pos, vec3.fromValues(clickVal[0], clickVal[1], clickVal[2]));
            this.wasClicked = true;
        } else if (Particle.rightClick) {
            let v = vec3.fromValues(clickVal[0] + change[0], 
                                    clickVal[1] + change[1], 
                                    clickVal[2] + change[2]);

            let increment = vec3.fromValues(0, 0, 0);
            vec3.subtract(increment, Particle.mouseLoc, Particle.mouseVec);
            vec3.normalize(increment, increment);
            increment = vec3.fromValues(increment[0] * 18, increment[1] * 18, increment[2] * 18);

            let isect1: boolean = false;
            let isect2: boolean = false;
            let iPos: vec3 = vec3.fromValues(0, 0, 0);

            let r = vec3.fromValues(Particle.mouseVec[0], Particle.mouseVec[1], Particle.mouseVec[2]);
            vec3.normalize(r, r);
            r = vec3.fromValues(r[0] * 70, r[1] * 70, r[2] * 70);

            for (let ray: vec3 = vec3.fromValues(r[0], r[1], r[2]); 
                 vec3.dist(ray, r) < 130; vec3.add(ray, ray, increment)) {

                if (vec3.dist(v, ray) < 10) {
                    isect1 = true;
                    iPos = vec3.fromValues(ray[0], ray[1], ray[2]);
                }
                if (vec3.dist(this.pos, ray) < 10) {
                    isect2 = true;
                }
            }

            if (isect1 && isect2) {
                vec3.subtract(clickVal, this.pos, iPos);
                vec3.normalize(clickVal, clickVal);
                this.pos = vec3.fromValues(this.orig[0] + 0.01 * time * clickVal[0], 
                                           this.orig[1] + 0.01 * time * clickVal[1], 
                                           this.orig[2] + 0.01 * time * clickVal[2])
                skip = true;
            } else if (isect1) {
                clickVal = vec3.fromValues(this.pos[0], this.pos[1], this.pos[2]);
            }

            this.wasClicked = true;
        }

        let returnPos: vec3 = vec3.fromValues(0, 0, 0);
        vec3.add(returnPos, returnPos, this.orig);
        if (!Particle.leftClick &&
            this.wasClicked && vec3.dist(this.pos, returnPos) > 5) {
            vec3.subtract(clickVal, returnPos, this.pos);
            vec3.normalize(clickVal, clickVal);
            vec3.add(clickVal, this.pos, vec3.fromValues(clickVal[0], clickVal[1], clickVal[2]));
            this.pos = clickVal;

            if (vec3.dist(this.pos, returnPos) <= 5) {
                this.wasClicked = false;
            }
        } else {
            if (!skip) {
                this.pos = vec3.fromValues(clickVal[0] + change[0], 
                                        clickVal[1] + change[1], 
                                        clickVal[2] + change[2]);
            }
        }
        
        this.colChange();
    }

    colChange() {
        // RGB Color fade Algorithm by Codepixl
        if(this.r > 0 && this.b == 0){
            this.r--;
            this.g++;
        }
        if(this.g > 0 && this.r == 0){
            this.g--;
            this.b++;
        }
        if(this.b > 0 && this.g == 0){
            this.r++;
            this.b--;
        }
    }
}

export default Particle;