import {vec3} from 'gl-matrix';
import {mat4, vec4} from 'gl-matrix';
import * as Stats from '../node_modules/stats-js';
import Drawable from './rendering/gl/Drawable';
import {gl} from './globals';

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
export class Rule {

    private expansions : Dictionary<string>;

    private operations : Dictionary<any>;

    constructor() {
        this.expansions = new Dictionary();
        this.operations = new Dictionary();
        
        // A placeholder for expansion
        this.expansions.Add("X", "MF-−--+F+F+F++F");
        // Branches
        this.expansions.Add("F", "F[RM&-F&-F^F^+F^[++&FFL[MM^FF&FML++LM]]^FLM]");
        //Leaves
        this.expansions.Add("L", "L");
        // Manipulates turtle direction
        this.expansions.Add("+", "+");
        this.expansions.Add("-", "-");
        this.expansions.Add("&", "&");
        this.expansions.Add("^", "^");
        // Turtle stack adjustments
        this.expansions.Add("[", "[");
        this.expansions.Add("]", "]");
        // Randomized adjustments
        this.expansions.Add("R", "R");
        this.expansions.Add("M", "M");
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
    depth: number;

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
        this.depth = depth;

        this.width = 0;
        this.height = 0;
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

// Uses WebGL to load objs for each needed shape
export class Shape {
    // Variables to read mesh
    obj: string;
    mesh: any;

    // Values for the future VBO
    pos: number[] = [];
    norms: number[] = [];
    idx: number[] = [];

    constructor(file: string) {
        // Reads the obj from index.html
        var OBJload = require('webgl-obj-loader');

        this.obj = document.getElementById(file).innerHTML;
        this.mesh = new OBJload.Mesh(this.obj);

        // The read in values:
        this.pos = this.mesh.vertices;
        this.norms = this.mesh.vertexNormals;
        this.idx = this.mesh.indices;
    }
}

// MY TREE!! thing
class LSystem extends Drawable {
    // VBO information
    indices: number[] = [];
    positions: number[] = [];
    normals: number[] = [];
    colors: number[] = [];

    // Variables to help draw
    center: vec3;
    degree: number;
    turn: number;
    width: number = 0.1;
    
    grammar = ["X"];
    rule : Rule = new Rule();

    // The OBJs
    trunk : Shape = new Shape('trunk.obj');
    leaf : Shape = new Shape('leaf.obj');

    constructor(center: vec3, angle: number) {
        super(); // Call the constructor of the super class. This is required.
        
        // First point in tree
        this.center = center;

        // Stores a degree between angles (degree=initial; turn=adjusted throughout class)
        this.degree = angle * Math.PI / 180;
        this.turn = angle * Math.PI / 180;
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

        for (let i = 0; i < gramCopy.length && i < 10; i++) {
            var s: string[] = this.rule.expand(gramCopy[i]).split("");
            // replace the expanded character
            this.grammar.splice(i + scanDisplacement, 1, s[0]);
            // add the rest of the new characters
            for(let j = 1; j < s.length && i < 10; j++) {
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

            // DRAWS BRANCH AND MOVES FORWARD
            if (this.grammar[i] == "F") {
                this.width = 0.1 * Math.pow(0.75, turt.depth);

                // Filling VBOs
                for (let j = 0; j < this.trunk.idx.length; j++) {
                    this.indices.push(this.trunk.idx[j] + numIDX);
                }
                for (let j = 0; j < this.trunk.norms.length; j += 3) {

                    let currNorm: vec4 = vec4.fromValues(this.trunk.norms[j], 
                                                         this.trunk.norms[j + 1], 
                                                         this.trunk.norms[j + 2], 0);
                    vec4.transformMat4(currNorm, currNorm, turt.dir);
                    
                    this.normals.push(currNorm[0]);
                    this.normals.push(currNorm[1]);
                    this.normals.push(currNorm[2]);
                    this.normals.push(0.0);

                }
                for (let j = 0; j < this.trunk.pos.length; j+= 3) {

                    let point: vec4 = vec4.fromValues(this.trunk.pos[j] * this.width, 
                                                      this.trunk.pos[j + 1] * this.width, 
                                                      this.trunk.pos[j + 2] * this.width, 1);
                    vec4.transformMat4(point, point, turt.dir);

                    this.positions.push(point[0] + turt.pos[0]);
                    this.positions.push(point[1] + turt.pos[1]);
                    this.positions.push(point[2] + turt.pos[2]);
                    this.positions.push(1);

                    this.colors.push(49 / 255.0);
                    this.colors.push(32 / 255.0);
                    this.colors.push(15 / 255.0);
                    this.colors.push(1.0);
                }

                // Adjusting Turtle
                let displacement = vec4.fromValues(3.5 * this.width, 
                                                   3.5 * this.width, 
                                                   3.5 * this.width, 1);
                vec4.multiply(displacement, displacement, vec4.fromValues(turt.dir[4], turt.dir[5], turt.dir[6], 1));

                let newPos = vec3.fromValues(displacement[0], displacement[1], displacement[2]);
                vec3.add(newPos, newPos, turt.pos);
                turt.updatePos(newPos, turt.depth + 1);
                
                numIDX += this.trunk.norms.length / 3;

            // DRAWS LEAF
            } else if (this.grammar[i] == "L") {
                this.width = 0.2 * Math.pow(0.9, turt.depth);

                // Filling VBOs
                for (let j = 0; j < this.leaf.idx.length; j++) {
                    this.indices.push(this.leaf.idx[j] + numIDX);
                }
                for (let j = 0; j < this.leaf.norms.length; j += 3) {

                    let currNorm: vec4 = vec4.fromValues(this.leaf.norms[j], 
                                                         this.leaf.norms[j + 1], 
                                                         this.leaf.norms[j + 2], 0);
                    vec4.transformMat4(currNorm, currNorm, turt.dir);
                    
                    this.normals.push(currNorm[0]);
                    this.normals.push(currNorm[1]);
                    this.normals.push(currNorm[2]);
                    this.normals.push(0.0);

                }
                for (let j = 0; j < this.leaf.pos.length; j+= 3) {

                    let point: vec4 = vec4.fromValues(this.leaf.pos[j] * this.width, 
                                                      this.leaf.pos[j + 1] * this.width, 
                                                      this.leaf.pos[j + 2] * this.width, 1);
                    vec4.transformMat4(point, point, turt.dir);

                    this.positions.push(point[0] + turt.pos[0]);
                    this.positions.push(point[1] + turt.pos[1]);
                    this.positions.push(point[2] + turt.pos[2]);
                    this.positions.push(1);

                    this.colors.push(5.0);
                    this.colors.push(5.0);
                    this.colors.push(5.0);
                    this.colors.push(5.0);
                }
                numIDX += this.leaf.norms.length / 3;

            // CHANGES MAGNITUTE OF DEGREES AND MAYBE MIRRORS IT
            } else if (this.grammar[i] == "M") {
                //Some random changes
                this.turn = (0.261799 + 0.349066 * Math.random()) * (Math.abs(this.degree) / 0.436332);
                if (Math.random() < 0.5) {
                    this.turn *= -1;
                }

            // ROTATES TURTLE ABOUT 90 DEGREES
            } else if (this.grammar[i] == "R") {
                let newDir = mat4.create();
                let changeVar = (Math.random() - 0.5) * 0.5;

                mat4.rotate(newDir, turt.dir, (Math.PI + changeVar) / 2, vec3.fromValues(turt.dir[4], turt.dir[5], turt.dir[6]));

                turt.updateDir(newDir);

            // NEW TURTLE
            } else if (this.grammar[i] == "[") {
                stack.push(new Turtle(turt.pos, turt.dir, turt.depth));
                turt = stack[stack.length - 1];
                
            // BYE TURTLE
            } else if (this.grammar[i] == "]") {
                stack.pop();
                turt = stack[stack.length - 1];

            // ROTATES TURTLE BY "TURN" AROUND ITS Y-AXIS
            } else if (this.grammar[i] == "+") {
                let newDir = mat4.create();
                
                mat4.rotate(newDir, turt.dir, this.turn, vec3.fromValues(turt.dir[4], turt.dir[5], turt.dir[6]));

                turt.updateDir(newDir);

            // ROTATES TURTLE BY "-TURN" AROUND ITS Y-AXIS
            } else if (this.grammar[i] == "-") {
                let newDir = mat4.create();
                
                mat4.rotate(newDir, turt.dir, -this.turn, vec3.fromValues(turt.dir[4], turt.dir[5], turt.dir[6]));

                turt.updateDir(newDir);

            // ROTATES TURTLE BY "TURN" AROUND ITS X- OR Z-AXIS
            } else if (this.grammar[i] == "&") {
                let newDir = mat4.create();

                let ang = 1;
                if (turt.pos[0] < 0) {
                    ang = -1;
                }
                
                if (Math.random() < 0.5) {
                    mat4.rotate(newDir, turt.dir, ang * this.turn, vec3.fromValues(turt.dir[8], turt.dir[9], turt.dir[10]));
                } else {
                    mat4.rotate(newDir, turt.dir, ang * this.turn, vec3.fromValues(turt.dir[0], turt.dir[1], turt.dir[2]));
                }

                turt.updateDir(newDir);
                
            // ROTATES TURTLE BY "-TURN" AROUND ITS X- OR Z-AXIS
            } else if (this.grammar[i] == "^") {
                let newDir = mat4.create();
                
                let ang = 1;
                if (turt.pos[0] < 0) {
                    ang = -1;
                }

                if (Math.random() < 0.5) {
                    mat4.rotate(newDir, turt.dir, ang * -this.turn, vec3.fromValues(turt.dir[8], turt.dir[9], turt.dir[10]));
                } else {
                    mat4.rotate(newDir, turt.dir, ang * -this.turn, vec3.fromValues(turt.dir[0], turt.dir[1], turt.dir[2]));
                }

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
    
        console.log(`Created tree`);
    }

}
export default LSystem;