import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
import {Shape} from '../Shape';
import Kelp from './Kelp';
import {Noise} from '../Noise';

class AllKelp {

    kelps: Kelp[] = [];

    constructor(amount: number) {
        let n: Noise = new Noise();

        /* Calculates "kelp" positions based on noise 
         * (noise 'amount' cutoff from GUI (maybe)) */

        for (let i = -200; i <= 200; i+=10) {
            for (let j = -200; j <= 200; j+=10) {
                // dist value to make Kelp more likely along the fringes and less in the center
                let dist = Math.sqrt(i * i + j * j);
                let currNoise = n.snoise(vec3.fromValues(i + 40, -50, j - 100)) / 100000000000;
                // check n set
                if (currNoise - (amount / 2 - dist * 2) > amount) {
                    let kelp = new Kelp(vec3.fromValues(i, -40, j), 10);
                    for (let i = 0; i < 2 + Math.random() * 2; i ++) {
                        kelp.expGram();
                    }
                    kelp.parseGram();
                    kelp.create();
                    kelp.setNumInstances(1);
                    this.kelps.push(kelp);
                }
            }
        }
    }
}
export default AllKelp;