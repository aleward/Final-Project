import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
import {Shape} from '../Shape';
import Coral from './Coral';
import {Noise} from '../Noise';

class AllCoral {

    //Stores all 12 coral clusters that chorespond to notes
    notes: Coral[] = [];

    // note type - true = white, false = black
    bOrW: boolean[] = [true, false, true, false, true, true, false, true, false, true, false, true];

    constructor() {
        /* Hard codes "note" positions */

        for (let i = -5.5; i < 6; i++) {
            // Shifts position forward if a white key
            let whiteShift: number = 0;
            if (this.bOrW[i + 5.5]) { whiteShift = -10; }

            let note: Coral = new Coral(vec3.fromValues(-50 - Math.abs((i + 1) * 1.4) + whiteShift, 
                                                        -40, i * 5 + i * (10 + whiteShift) / 10));

            for (let i = 0; i < 3 + Math.random() * 3; i ++) {
                note.expGram();
            }

            note.parseGram();
            note.create();
            note.setNumInstances(1);
            this.notes.push(note);
        }
    }
}
export default AllCoral;