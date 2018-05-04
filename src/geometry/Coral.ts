import {vec3} from 'gl-matrix';
import {mat4, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
import {Dictionary, Turtle} from './Kelp';
import {Shape} from '../Shape';

// Stores each grammar expansion for my plant
export class CoralRule {

    private expansions : Dictionary<string>;

    private operations : Dictionary<any>;

    constructor() {
        this.expansions = new Dictionary();
        this.operations = new Dictionary();
        
        // A placeholder for expansion
        this.expansions.Add("X", "+F+<F-F-+F+-FM");
        // M helps expansion
        this.expansions.Add("M", "<+F-+F-F+-FM");
        // Turns turtle
        this.expansions.Add("+", "+");
        this.expansions.Add("-", "-");
        // Moves turtle outward
        this.expansions.Add("<", "<");
        // Draws coral pieces
        this.expansions.Add("F", "F");
    }

    expand(s : string): string { // adjust for array of strings
        if (this.expansions.ContainsKey(s)) {
            return this.expansions.Item(s);
        } else {
            return " ";
        }
    }
}


// MY KELP!! thing
class Coral extends Drawable {
    // VBO information
    indices: number[] = [];
    positions: number[] = [];
    normals: number[] = [];
    colors: number[] = [];

    // Variables to help draw
    center: vec3;
    
    grammar = ["X"];
    rule : CoralRule = new CoralRule();

    // The sample VBO
    piece: Shape = new Shape("coral3.obj", 1);
    size: number = 1;

    constructor(center: vec3) {
        super(); // Call the constructor of the super class. This is required.
        
        // First point in kelp
        this.center = center;
    }

    // Function to expand the currently stored grammar
    expGram() {
        // Makes a copy to parse while adjusting the real grammar
        var gramCopy: string[] = [];
        for (let i = 0; i < this.grammar.length; i++) {
            gramCopy.push(this.grammar[i]);
        }

        // tracks index displacement to splice correctly
        var scanDisplacement: number = 0;

        for (let i = 0; i < gramCopy.length; i++) {
            var s: string[] = this.rule.expand(gramCopy[i]).split("");
            // replace the expanded character
            this.grammar.splice(i + scanDisplacement, 1, s[0]);
            // add the rest of the new characters
            for(let j = 1; j < s.length; j++) {
                this.grammar.splice(i + j + scanDisplacement, 0, s[j]);
            }
            scanDisplacement += s.length - 1;
        }
    }

    // Reads the grammar and completes the associated actions
    parseGram() {

        // Created turtle stack and sets current turtle as "turt"
        var stack: Turtle[] = [];
        stack.push(new Turtle(this.center, mat4.create(), 1));
        var turt = stack[0];

        // Offsets the VBO indices for each Shape
        var numIDX: number = 0;

        // PARSING.....
        for(let i = 0; i < this.grammar.length; i++) {

            // DRAWS CORAL PIECE AND MOVES ONWARD
            if (this.grammar[i] == "F" && (turt.depth == 1 || Math.random() < 0.8)) {
                // keep this.width from prior
                let currMat: mat4 = turt.dir;

                // Filling VBOs
                for (let j = 0; j < this.piece.idx.length; j++) {
                    this.indices.push(this.piece.idx[j] + numIDX);
                }
                for (let j = 0; j < this.piece.norms.length; j += 3) {

                    let currNorm: vec4 = vec4.fromValues(this.piece.norms[j], 
                                                         this.piece.norms[j + 1], 
                                                         this.piece.norms[j + 2], 0);
                    vec4.transformMat4(currNorm, currNorm, turt.turn);
                    vec4.transformMat4(currNorm, currNorm, turt.dir);
                    
                    this.normals.push(currNorm[0]);
                    this.normals.push(currNorm[1]);
                    this.normals.push(currNorm[2]);
                    this.normals.push(0.0);
                }
                for (let j = 0; j < this.piece.pos.length; j+= 3) {
                    let point: vec4 = vec4.fromValues(this.piece.pos[j] / Math.sqrt(turt.depth) * this.size, 
                                                      this.piece.pos[j + 1] / Math.sqrt(turt.depth) * this.size, 
                                                      this.piece.pos[j + 2] / Math.sqrt(turt.depth) * this.size, 1);
                    vec4.transformMat4(point, point, turt.turn);
                    vec4.add(point, point, vec4.fromValues(turt.shift[0], 0, turt.shift[2], 0));
                    vec4.transformMat4(point, point, turt.dir);

                    this.positions.push(point[0] + turt.pos[0]);
                    this.positions.push(point[1] + turt.pos[1]);
                    this.positions.push(point[2] + turt.pos[2]);
                    this.positions.push(1);

                    this.colors.push(103 / 255.0);
                    this.colors.push(63 / 255.0);
                    this.colors.push(168 / 255.0);
                    this.colors.push(1.0);
                }
                turt.updateDepth(turt.depth + 1);
                
                numIDX += this.piece.norms.length / 3;

            // SHIFTS TURTLE OUTWARD
            } else if (this.grammar[i] == "<") {
                turt.shift = vec3.fromValues(0, 0, turt.shift[2] + 1.5 /*/ Math.sqrt(turt.depth)*/ * this.size);

            // ROTATES TURTLE RANDOMLY AROUND ITS Y-AXIS
            } else if (this.grammar[i] == "+") {
                let newDir = mat4.create();
                
                let rotNum: number = (Math.random() * 360);
                rotNum *= Math.PI / 180

                mat4.rotate(newDir, turt.turn, rotNum, vec3.fromValues(turt.dir[4], turt.dir[5], turt.dir[6]));
                turt.turn = newDir;

            // ROTATES TURTLE RANDOMLY BY SLIGHTLY LESS AROUND ITS Y-AXIS
            } else if (this.grammar[i] == "-") {
                let newDir = mat4.create();
                
                let rotNum: number = (Math.random() * 110);
                rotNum *= Math.PI / 180

                mat4.rotate(newDir, turt.dir, rotNum, vec3.fromValues(turt.dir[4], turt.dir[5], turt.dir[6]));
                turt.updateDir(newDir);

            }
        }
    }

    create() {
        var finalIndices: Uint32Array = new Uint32Array(this.indices);
        var finalPositions: Float32Array = new Float32Array(this.positions);
        var finalNormals: Float32Array = new Float32Array(this.normals);
        var finalColors: Float32Array = new Float32Array(this.colors);   

        this.generateIdx();
        this.generatePos();
        this.generateNor();
        this.generateCol();
    
        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, finalIndices, gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
        gl.bufferData(gl.ARRAY_BUFFER, finalNormals, gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, finalPositions, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
        gl.bufferData(gl.ARRAY_BUFFER, finalColors, gl.STATIC_DRAW);
    
        console.log(`Created coral`);
    }

}
export default Coral;