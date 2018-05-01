import {vec2, vec3, vec4} from 'gl-matrix';

/* Alexis Ward
 * id: aleward
 * CIS 566 */ 

class Particle {
    orig: vec3; // original point
    pos: vec3;  // position to draw at
    vel: vec3;  // velocity
    acc: vec3;  // acceleration

    // a time offset for each particle to differentiate motion
    offset: number;
    
    // Colors
    r: number = 255;
    g: number = 0;
    b: number = 0;

    // Mesh attributes
    static meshMode: number = -1;
    isMesh: boolean[] = [];
    meshPos: vec3[] = [];

    // Mouse values
    static leftClick: boolean = false;
    static rightClick: boolean = false;
    static mouseLoc: vec3 = vec3.fromValues(5, 5, 0); // worldspace centered location
    static mouseVec: vec3 = vec3.fromValues(0, 0, 0); // worldspace mouse location

    wasClicked: boolean = false;
    changeMesh: boolean = false;

    constructor(pos: vec3) {
        this.pos = pos;
        this.orig = pos;
        this.vel = vec3.fromValues(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        this.acc = vec3.fromValues(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);

        this.offset = Math.random();

        // increment the color changes more the further the particle is from the center
        for (let i = 0; i < vec3.length(pos) * 4; i++) {
            this.colChange();
        }
    }

    // Called with each tic, updates particle motion (and color)
    setVals(time: number) {
        // Makes time cyclic
        let timeVal = Math.sin(0.01 * (time) + this.offset) * 20;

        // Acts as the change in position over time, based on physics
        let change: vec3 = vec3.fromValues(0.01 * timeVal * (this.vel[0] + timeVal * this.acc[0]), 
                                           0.01 * timeVal * (this.vel[1] + timeVal * this.acc[1]), 
                                           0.01 * timeVal * (this.vel[2] + timeVal * this.acc[2]));
        
        // whether to use the final position incrementation
        let skip: boolean = false;

        // Starting assumption of the position, to be changed based on mouse clicks / current meshes
        let clickVal = vec3.fromValues(this.orig[0], this.orig[1], this.orig[2]);
        
        if (Particle.meshMode != -1 && this.isMesh[Particle.meshMode]) {
            clickVal = vec3.fromValues(this.meshPos[Particle.meshMode][0], 
                                       this.meshPos[Particle.meshMode][1], 
                                       this.meshPos[Particle.meshMode][2]);
            this.changeMesh = true;
        }
        
        // PARTICLE ATTRACTION
        if (Particle.leftClick) {
            vec3.subtract(clickVal, Particle.mouseLoc, this.pos);
            vec3.normalize(clickVal, clickVal);
            vec3.add(clickVal, this.pos, vec3.fromValues(clickVal[0], clickVal[1], clickVal[2]));
            this.wasClicked = true;

        // PARTICLE REPULSION
        } else if (Particle.rightClick) {
            // Where the particle should be at this time
            let v = vec3.fromValues(clickVal[0] + change[0], 
                                    clickVal[1] + change[1], 
                                    clickVal[2] + change[2]);
            
            // RAY TRACES A PATH THROUGH THE PARTICLES TO REPEL FROM:

            // The ray direction
            let increment = vec3.fromValues(0, 0, 0);
            vec3.subtract(increment, Particle.mouseLoc, Particle.mouseVec);
            vec3.normalize(increment, increment);
            increment = vec3.fromValues(increment[0] * 36, increment[1] * 36, increment[2] * 36);

            // Define whether this particle needs to be repelled and where from
            let isect1: boolean = false;
            let isect2: boolean = false;
            let iPos: vec3 = vec3.fromValues(0, 0, 0);
            
            // The starting ray position:
            let r = vec3.fromValues(Particle.mouseVec[0], Particle.mouseVec[1], Particle.mouseVec[2]);
            vec3.normalize(r, r);
            r = vec3.fromValues(r[0] * 70, r[1] * 70, r[2] * 70);

            // Trace
            for (let ray: vec3 = vec3.fromValues(r[0], r[1], r[2]); 
                 vec3.dist(ray, r) < 260; vec3.add(ray, ray, increment)) {

                if (vec3.dist(v, ray) < 20) {
                    isect1 = true;
                    iPos = vec3.fromValues(ray[0], ray[1], ray[2]);
                }
                if (vec3.dist(this.pos, ray) < 20) {
                    isect2 = true;
                }
            }

            // If both the expected position and the current position are in the repelling zone, repel
            if (isect1 && isect2) {
                let move: vec3 = vec3.fromValues(this.pos[0] - iPos[0], 
                                                 this.pos[1] - iPos[1], 
                                                 this.pos[2] - iPos[2]);
                vec3.normalize(move, move);
                // Sets the position here, and skips the following position definition
                this.pos = vec3.fromValues(clickVal[0] + 0.01 * time * move[0], 
                                           clickVal[1] + 0.01 * time * move[1], 
                                           clickVal[2] + 0.01 * time * move[2])
                skip = true;
            // If the particle has been properly repelled, keep it away
            } else if (isect1) {
                clickVal = vec3.fromValues(this.pos[0], this.pos[1], this.pos[2]);
            }

            this.wasClicked = true;
        }

        // DEFINE FINAL POSITIONS
        let returnPos: vec3 = vec3.fromValues(this.orig[0], this.orig[1], this.orig[2]);

        // Brings the particles back to their initial positions if need be
        if (!Particle.leftClick &&
            this.wasClicked && vec3.dist(this.pos, returnPos) > 5) {

            vec3.subtract(clickVal, returnPos, this.pos);
            vec3.normalize(clickVal, clickVal);
            vec3.add(clickVal, this.pos, vec3.fromValues(clickVal[0], clickVal[1], clickVal[2]));
            this.pos = clickVal;

            if (vec3.dist(this.pos, returnPos) <= 5) {
                this.wasClicked = false;
            }
        // A check for mesh shifts
        } else if (this.changeMesh && !this.wasClicked) {
            let v = vec3.fromValues(clickVal[0] + change[0], 
                                    clickVal[1] + change[1], 
                                    clickVal[2] + change[2]);
            if (vec3.dist(this.pos, v) >= 1) {
                vec3.subtract(clickVal, v, this.pos);
                vec3.normalize(clickVal, clickVal);
                vec3.add(clickVal, this.pos, vec3.fromValues(clickVal[0], clickVal[1], clickVal[2]));
                this.pos = clickVal;

                if (vec3.dist(this.pos, v) < 1) {
                    this.changeMesh = false;
                }
            }
        // Log position
        } else {
            if (!skip) {
                this.pos = vec3.fromValues(clickVal[0] + change[0], 
                                        clickVal[1] + change[1], 
                                        clickVal[2] + change[2]);
            }
        }
        
        this.colChange();
    }

    // Causes the rainbow shift in colors!
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