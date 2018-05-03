import {vec3} from 'gl-matrix';
import {mat4, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

// Dictionary class from Dustin Horne's website, 06/09/2016
export class Dictionary<T> {
    private items: { [index: string]: T } = {};
 
    private count: number = 0;
 
    public ContainsKey(key: string): boolean {
        return this.items.hasOwnProperty(key);
    }
 
    public Count(): number {
        return this.count;
    }
 
    public Add(key: string, value: T) {
        if(!this.items.hasOwnProperty(key))
             this.count++;
 
        this.items[key] = value;
    }
 
    public Remove(key: string): T {
        var val = this.items[key];
        delete this.items[key];
        this.count--;
        return val;
    }
 
    public Item(key: string): T {
        return this.items[key];
    }
 
    public Keys(): string[] {
        var keySet: string[] = [];
 
        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                keySet.push(prop);
            }
        }
 
        return keySet;
    }
 
    public Values(): T[] {
        var values: T[] = [];
 
        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                values.push(this.items[prop]);
            }
        }
 
        return values;
    }
}

// Stores each grammar expansion for my plant
export class KelpRule {

    private expansions : Dictionary<string>;

    private operations : Dictionary<any>;

    constructor() {
        this.expansions = new Dictionary();
        this.operations = new Dictionary();
        
        // A placeholder for expansion
        this.expansions.Add("X", "F+HWT");//"MF-−--+F+F+F++F");
        // Manipulates turtle width and height respectively, W helps expansion
        this.expansions.Add("W", "WF+HW");
        this.expansions.Add("H", "H");
        // Draws kelp pieces (T is the pointed top, contains additional weight adjustment)
        this.expansions.Add("F", "F");
        this.expansions.Add("T", "T");
        // Add rotations

        // // Branches
        // this.expansions.Add("F", "F[RM&-F&-F^F^+F^[++&FFL[MM^FF&FML++LM]]^FLM]");
        // //Leaves
        // this.expansions.Add("L", "L");
        // // Manipulates turtle direction
        // this.expansions.Add("+", "+");
        // this.expansions.Add("-", "-");
        // this.expansions.Add("&", "&");
        // this.expansions.Add("^", "^");
        // // Turtle stack adjustments
        // this.expansions.Add("[", "[");
        // this.expansions.Add("]", "]");
        // // Randomized adjustments
        // this.expansions.Add("R", "R");
        // this.expansions.Add("M", "M");
    }

    expand(s : string): string { // adjust for array of strings
        if (this.expansions.ContainsKey(s)) {
            return this.expansions.Item(s);
        } else {
            return " ";
        }
    }
}

// Tracks position, direction, and other needed vairables while reading the grammar
export class Turtle {
    pos: vec3;
    dir: mat4;
    turn: mat4;
    depth: number;
    shift: vec3;

    // Necessary for house grammar
    // Proportions:
    width: number;
    height: number;
    // Whether to draw
    build: boolean
    continue: boolean;
    // House type
    tallBuild: boolean;
    
    constructor(pos: vec3, dir: mat4, depth: number) {
        this.pos = pos;
        this.dir = dir;
        this.turn = mat4.create();
        this.depth = depth;
        this.shift = vec3.fromValues(0, 0, 0);

        this.width = 0.5;
        this.height = 2;
        this.build = false;
        this.continue = true;
        this.tallBuild = false;
    }

    updatePos(pos: vec3, depth: number) {
        this.pos = pos;
        this.depth = depth;
    }

    updateDir(dir: mat4) {
        this.dir = dir;
    }

    updateDepth(d: number) {
        this.depth = d;
    }

    updateHeight(h: number) {
        this.height = h;
    }
}

// Stores a sample plane
export class SimplePiece {
    // Values for the future VBO
    pos: number[] = [];
    norms: number[] = [];
    idx: number[] = [];

    constructor() {
        // stores values:
        this.pos = [0, 0, -0.5, 1,
                    0, 0,  0.5, 1,
                    0, 1,  0.5, 1,
                    0, 1, -0.5, 1];
        this.norms = [1, 0, 0, 0,
                      1, 0, 0, 0,
                      1, 0, 0, 0,
                      1, 0, 0, 0];
        this.idx = [0, 1, 2, 0, 2, 3];
    }
}

// MY KELP!! thing
class Kelp extends Drawable {
    // VBO information
    indices: number[] = [];
    positions: number[] = [];
    normals: number[] = [];
    colors: number[] = [];

    // Variables to help draw
    center: vec3;
    degree: mat4;
    turn: number;
    width: number;
    height: number;
    
    grammar = ["X"];
    rule : KelpRule = new KelpRule();

    // The sample VBO
    piece: SimplePiece = new SimplePiece();
    // trunk : any; //Shape = new Shape('trunk.obj');
    leaf : any;//Shape = new Shape('leaf.obj');

    constructor(center: vec3, angle: number) {
        super(); // Call the constructor of the super class. This is required.
        
        // First point in kelp
        this.center = center;

        // Stores a degree between angles (degree=initial; turn=adjusted throughout class)
        this.degree = mat4.create();
        this.turn = angle;
        this.width = 0.5;
        this.height = 2;
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

            // DRAWS KELP PIECE AND MOVES FORWARD
            if (this.grammar[i] == "F") {
                // keep this.width from prior
                this.height = turt.height;
                let currMat: mat4 = this.degree;

                // Filling VBOs
                for (let j = 0; j < this.piece.idx.length; j++) {
                    this.indices.push(this.piece.idx[j] + numIDX);
                }
                for (let j = 0; j < this.piece.norms.length; j += 4) {

                    let currNorm: vec4 = vec4.fromValues(this.piece.norms[j], 
                                                         this.piece.norms[j + 1], 
                                                         this.piece.norms[j + 2], 0);
                                                         //this.piece.norms[j + 3]);
                    vec4.transformMat4(currNorm, currNorm, currMat);
                    
                    this.normals.push(currNorm[0]);
                    this.normals.push(currNorm[1]);
                    this.normals.push(currNorm[2]);
                    this.normals.push(0.0);

                    if (j == 4) {
                        currMat = turt.dir;
                    }
                }
                currMat = this.degree;
                for (let j = 0; j < this.piece.pos.length; j+= 4) {
                    let point: vec4 = vec4.fromValues(this.piece.pos[j] * this.width, 
                                                      this.piece.pos[j + 1] * this.height, 
                                                      this.piece.pos[j + 2] * this.width, 1);
                    vec4.transformMat4(point, point, currMat);

                    this.positions.push(point[0] + turt.pos[0]);
                    this.positions.push(point[1] + turt.pos[1]);
                    this.positions.push(point[2] + turt.pos[2]);
                    this.positions.push(1);

                    // 25, 109, 8
                    this.colors.push(70 / 255.0);
                    this.colors.push(150 / 255.0);
                    this.colors.push(54 / 255.0);
                    this.colors.push(1.0);
                    
                    if (j == 4) {
                        this.width = turt.width;
                        currMat = turt.dir;
                    }
                }
                this.degree = turt.dir;

                // Adjusting Turtle
                let displacement = vec4.fromValues(0, this.height, 0, 1);
                //vec4.multiply(displacement, displacement, vec4.fromValues(turt.dir[4], turt.dir[5], turt.dir[6], 1));

                let newPos = vec3.fromValues(displacement[0], displacement[1], displacement[2]);
                vec3.add(newPos, newPos, turt.pos);
                turt.updatePos(newPos, turt.depth + 1);
                
                numIDX += this.piece.norms.length / 4;

            // DRAWS KELP TIP
            } else if (this.grammar[i] == "T") {
                // keep this.width from prior
                this.height = turt.height;
                let currMat: mat4 = this.degree;

                // Filling VBOs
                for (let j = 0; j < this.piece.idx.length; j++) {
                    this.indices.push(this.piece.idx[j] + numIDX);
                }
                for (let j = 0; j < this.piece.norms.length; j += 4) {

                    let currNorm: vec4 = vec4.fromValues(this.piece.norms[j], 
                                                         this.piece.norms[j + 1], 
                                                         this.piece.norms[j + 2], 0);
                                                         //this.piece.norms[j + 3]);
                    vec4.transformMat4(currNorm, currNorm, currMat);
                    
                    this.normals.push(currNorm[0]);
                    this.normals.push(currNorm[1]);
                    this.normals.push(currNorm[2]);
                    this.normals.push(0.0);

                    if (j == 4) {
                        currMat = turt.dir;
                    }
                }
                currMat = this.degree;
                for (let j = 0; j < this.piece.pos.length; j+= 4) {
                    let point: vec4 = vec4.fromValues(this.piece.pos[j] * this.width, 
                                                      this.piece.pos[j + 1] * this.height, 
                                                      this.piece.pos[j + 2] * this.width, 1);
                    vec4.transformMat4(point, point, currMat);

                    this.positions.push(point[0] + turt.pos[0]);
                    this.positions.push(point[1] + turt.pos[1]);
                    this.positions.push(point[2] + turt.pos[2]);
                    this.positions.push(1);

                    this.colors.push(70 / 255.0);
                    this.colors.push(150 / 255.0);
                    this.colors.push(54 / 255.0);
                    this.colors.push(1.0);
                    
                    if (j == 4) {
                        this.width = 1;
                        currMat = turt.dir;
                    }
                }
                this.degree = turt.dir;

                numIDX += this.piece.norms.length / 4;

            // CHANGES MAGNITUTE OF SEGMENT WIDTH
            } else if (this.grammar[i] == "W") {
                turt.width = Math.random() * 2 + 3;

            // CHANGES MAGNITUTE OF SEGMENT HEIGHT
            } else if (this.grammar[i] == "H") {
                turt.height = Math.random() * 3 + 3;

            // ROTATES TURTLE BY "TURN" AROUND ITS Y-AXIS
            } else if (this.grammar[i] == "+") {
                let newDir = mat4.create();
                
                let rotNum: number = (Math.random() * 30 + this.turn);
                if (Math.random() < 0.5) { rotNum *= -1; }
                rotNum *= Math.PI / 180

                mat4.rotate(newDir, turt.dir, rotNum, vec3.fromValues(turt.dir[4], turt.dir[5], turt.dir[6]));

                turt.updateDir(newDir);

            // ROTATES TURTLE BY "-TURN" AROUND ITS Y-AXIS
            } else if (this.grammar[i] == "-") {
                let newDir = mat4.create();
                
                mat4.rotate(newDir, turt.dir, -this.turn, vec3.fromValues(turt.dir[4], turt.dir[5], turt.dir[6]));

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
    
        console.log(`Created kelp`);
    }

}
export default Kelp;