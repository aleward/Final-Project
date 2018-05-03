import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
import {Shape} from '../Shape';
import Ray from './Ray';
import {Noise} from '../Noise';

class GodRays {

    rays: Ray[] = [];

    constructor(amount: number) {
        let n: Noise = new Noise();

        /* Calculates "ray" positions based on noise 
         * (noise 'amount' cutoff from GUI (maybe)) */

        for (let i = -200; i <= 200; i+=40) {
            for (let j = -200; j <= 200; j+=40) {
                let currNoise = n.snoise(vec3.fromValues(i * 37 + 20, 0, j * 37)) / 100000000000;
                if (currNoise > amount) {
                    let ray = new Ray(vec3.fromValues(0, 125, 0), 0, vec3.fromValues(i, -40, j));
                    ray.create();
                    ray.setNumInstances(1);
                    this.rays.push(ray);
                }
            }
        }
    }
}
export default GodRays;