import {vec3} from 'gl-matrix';
import {mat4, vec4} from 'gl-matrix';
import * as Stats from '../node_modules/stats-js';
import Drawable from './rendering/gl/Drawable';
import {gl} from './globals';
import {Shape, Turtle, Rule} from './LSystem';
import {Noise} from './Noise';
import {Dictionary} from './LSystem';
import LSystem from './LSystem';
import {PrimMST, Edge} from './Dijkstra';

// A dictionary for the city expansion
export class CityRule {

    private expansions : Dictionary<string[]>;

    constructor() {
        this.expansions = new Dictionary();

        // Water block
        this.expansions.Add("W", ["W"]);
        // Land blobs
        this.expansions.Add("L", ["L"]);
        // Bridge structure
        this.expansions.Add("B", []);
        this.expansions.Add("(", ["("]);
        this.expansions.Add(")", [")"]);
        this.expansions.Add("-", ["-"]);
        // House (and tree) structure and location
        this.expansions.Add("U", ["[[<h=]+[<h=]+[<h=]+[<h=]+[<h=]+[<h=]+[<h=]+[<h=]+[<h=]]"]);
        this.expansions.Add("G", ["[[<<h=]*[<<h=]*[<<h=]*[<<h=]*[<<h=]*[<<h=]*[<<h=]*[<<h=]*[<<h=]]"]);
        this.expansions.Add("=", ["r"]);
        this.expansions.Add("h", ["hs"]);
        this.expansions.Add("s", ["s"]);
        this.expansions.Add("r", ["r"]);
        this.expansions.Add("<", ["<"]);
        this.expansions.Add("+", ["+"]);
        this.expansions.Add("*", ["*"]);
        // Turtle operations
        this.expansions.Add("[", ["["]);
        this.expansions.Add("]", ["]"]);
    }

    // Adds possible expansions to grammar
    addExp(key: string, element: string) {
        this.expansions.Item(key).push(element);
    }

    // Expands a character
    expand(s : string): string {
        if (this.expansions.ContainsKey(s)) {
            if (this.expansions.Item(s). length > 1) {
                return this.expansions.Item(s).pop();
            } else {
                return this.expansions.Item(s)[0];
            }
        } else {
            return " ";
        }
    }

    // Print for testing purposes
    print() {
        console.log(this.expansions);
    }
}

// MY WEIRD CITY!!!
export class City extends Drawable {
    // VBO information
    indices: number[] = [];
    positions: number[] = [];
    normals: number[] = [];
    colors: number[] = [];

    rule : CityRule = new CityRule();
    grammar = ["W"];

    /************
     * THE OBJs *
     ************/

    water : Shape = new Shape('water.obj');
    island: Shape = new Shape('island.obj');

    // HOUSE OBJS
    house: Shape = new Shape('house.obj');

    // The square-er houses:
    sArray: any[];
    sColArray: vec3[];
    sFloor1: Shape = new Shape('sFloor1.obj');
    sFloor2: Shape = new Shape('sFloor2.obj');
    sRoof: Shape = new Shape('sRoof.obj');

    // The rounder houses:
    rArray: any[];
    rColArray: vec3[];
    rFloor1a: Shape = new Shape('rFloor1a.obj');
    rFloor1b: Shape = new Shape('rFloor1b.obj');
    rFloor2a: Shape = new Shape('rFloor2a.obj');
    rFloor2b: Shape = new Shape('rFloor2b.obj');
    rRoofa: Shape = new Shape('rRoofa.obj');
    rRoofb: Shape = new Shape('rRoofb.obj');

    // BRIDGE OBJS
    stairUp: Shape = new Shape('stairUp.obj');
    bridge: Shape = new Shape('bridge.obj');
    stairDown: Shape = new Shape('stairDown.obj');

    // Stores the island and bridge positions for associated geometry
    islPos: any[] = [];
    bridges: Edge[] = [];

    // Noise that determines island, house, and tree position 
    // - as well as height, width, etc.
    n: Noise = new Noise();

    // Whether to include trees (determined by GUI)
    trees: boolean;

    constructor(waterAmount: number, trees: boolean) {
        super();

        this.trees = trees;

        // Setting up house shape arrays
        this.sArray = [[this.sFloor1],  // index 1 = ground floor
                       [this.sFloor2],         //2 = middle floors
                       [this.sRoof]];          //3 = roof

        this.rArray = [[this.rFloor1a, this.rFloor1b],  // Same as above ^
                       [this.rFloor2a, this.rFloor2b], 
                       [this.rRoofa, this.rRoofb]];

        // House colors for easy access
        this.sColArray = [vec3.fromValues(60 / 255.0,
                                          20 / 255.0, 
                                          50 / 255.0)];
        this.rColArray = [vec3.fromValues(0 / 255.0, 
                                          0 / 255.0, 
                                          0 / 255.0), 
                          vec3.fromValues(0 / 255.0, 
                                          0 / 255.0, 
                                          255 / 255.0)];

        // Calculates "island" positions based on noise (noise cutoff from GUI)
        // also tracks and adds appropriate expansions for "W" and "L"
        let iString: string = "W[";
        for (let i = -5; i <= 5; i++) {
            for (let j = -5; j <= 5; j++) {
                let currNoise = this.n.snoise(vec3.fromValues(i, 0, j)) / 100000000000;
                if (currNoise > waterAmount) {
                    this.islPos.push([i,j]);
                    iString += "L";
                    this.rule.addExp("L", "L[UG]");
                }
            }
        }
        iString += "][";

        // Creates aa minimum spanning tree to figure where to place the most efficient bridges
        let mst: PrimMST = new PrimMST(this.islPos);
        let mstE: Edge[] = mst.edges();

        for (let i = 0; i < mstE.length; i++) {
            if (mstE[i].getWeight() > 2) {
                this.bridges.push(mstE[i]);
                iString += "B";
            }
        }
        // ... and how long those bridges should be
        for (let i = 1; i <= this.bridges.length; i++) {
            let bString: string = "(";
            for (let dist = 0; 
                     dist < this.bridges[this.bridges.length- i].getWeight() - 2; 
                     dist += 0.1) {
                bString += "-";
            }
            bString += ")";
            this.rule.addExp("B", bString);
        }
        
        iString += "]";
        this.rule.addExp("W", iString);
    }

    // Function to expand the currently stored grammar
    expGram() {
        // Makes a copy to parse while adjusting the real grammar
        var gramCopy: string[] = [];
        for (let i = 0; i < this.grammar.length; i++) {
            gramCopy.push(this.grammar[i]);
        }

        var scanDisplacement: number = 0; // tracks index displacement to splice correctly

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

    // If a value is out of bounds, adjust it.
    cutOffCheck(x: number): number {
        if (x < 0) {
            return Math.max(x, -5);
        } else {
            return Math.min(x, 5);
        }
    }

    // Checks whether a vector is in bounds of the city area
    checkInBounds(x: vec3): boolean {
        return x[0] > -5 && x[0] < 5 && x[2] > -5 && x[2] < 5;
    }

    // Function to add tree shapes from my LSystem class
    addTree(idx: number, turt: Turtle): number {
        let lsystem: LSystem = new LSystem(vec3.fromValues(0, 0, 0), 25);
        for (let i = 0; i < 3; i++) {
            lsystem.expGram();
        }
        lsystem.parseGram();

        let lgth = lsystem.indices.length;

        for (let j = 0; j < lgth; j++) {
            this.indices.push(lsystem.indices[j] + idx);
        }
        for (let j = 0; j < lsystem.positions.length; j+=4) {
            this.positions.push(lsystem.positions[j] * 0.4 + turt.dir[12] + turt.pos[0]);
            this.positions.push(lsystem.positions[j + 1] * 0.4 + turt.dir[13] + turt.pos[1]);
            this.positions.push(lsystem.positions[j + 2] * 0.4 + turt.dir[14] + turt.pos[2]);
            this.positions.push(1);

            for (let k = j; k < j + 4; k++) {
                this.normals.push(lsystem.normals[k]);
                this.colors.push(lsystem.colors[k]);
            }
        }

        return idx + lsystem.normals.length / 4;
    }

    // Reads the grammar and completes the associated actions
    parseGram() {

        // Created turtle stack and sets current turtle as "turt"
        var stack: Turtle[] = [];
        stack.push(new Turtle(vec3.fromValues(0, 0, 0), mat4.create(), 0));
        var turt = stack[0];

        // Offsets the VBO indices for each Shape
        var numIDX: number = 0;

        // PARSING.....
        for(let i = 0; i < this.grammar.length; i++) {

            // DRAWS WATER BLOCK
            if (this.grammar[i] == "W") {

                // Filling VBOs
                for (let j = 0; j < this.water.idx.length; j++) {
                    this.indices.push(this.water.idx[j] + numIDX);
                }
                for (let j = 0; j < this.water.pos.length; j+= 3) {
                    this.normals.push(this.water.norms[j]);
                    this.normals.push(this.water.norms[j + 1]);
                    this.normals.push(this.water.norms[j + 2]);
                    this.normals.push(0.0);

                    this.positions.push(this.water.pos[j]);
                    this.positions.push(this.water.pos[j + 1]);
                    this.positions.push(this.water.pos[j + 2]);
                    this.positions.push(1);

                    this.colors.push(0 / 255.0);
                    this.colors.push(0 / 255.0);
                    this.colors.push(255 / 255.0);
                    this.colors.push(1.0);
                }

                numIDX += this.water.norms.length / 3;

            // DRAWS LAND BLOBS
            } else if (this.grammar[i] == "L") {

                // Finds and sets turtle position/height based on the stored array and noise
                let xI: number = this.islPos[turt.depth][0];
                let zI: number = this.islPos[turt.depth][1];

                let height: number = this.n.snoise(vec3.fromValues(xI, 0, zI)) / 100000000000;
                height = (height - 100) / 850;

                turt.pos = vec3.fromValues(xI, height * 0.43, zI);

                // Filling VBOs
                for (let j = 0; j < this.island.idx.length; j++) {
                    this.indices.push(this.island.idx[j] + numIDX);
                }
                for (let j = 0; j < this.island.pos.length; j+= 3) {
                    // Adjusts normals for varying hill/island height
                    let warp = vec3.fromValues(this.island.norms[j], 
                                               this.island.norms[j + 1] / height, 
                                               this.island.norms[j + 2]);
                    vec3.normalize(warp, warp);

                    let x: number = this.island.pos[j] + xI;
                    let z: number = this.island.pos[j + 2] + zI;
                    
                    this.normals.push(warp[0]);
                    this.normals.push(warp[1]);
                    this.normals.push(warp[2]);
                    this.normals.push(0.0);

                    this.positions.push(this.cutOffCheck(x));
                    this.positions.push(this.island.pos[j + 1] * height);
                    this.positions.push(this.cutOffCheck(z));
                    this.positions.push(1);

                    if (this.island.pos[j + 1] > 0.01) {
                        this.colors.push(0 / 255.0);
                        this.colors.push(255 / 255.0);
                        this.colors.push(0 / 255.0);
                        this.colors.push(1.0);
                    } else {
                        this.colors.push(255 / 255.0);
                        this.colors.push(255 / 255.0);
                        this.colors.push(0 / 255.0);
                        this.colors.push(1.0);
                    }
                }

                numIDX += this.island.norms.length / 3;
                turt.depth++;

            // NEW TURTLE
            } else if (this.grammar[i] == "[") {
                stack.push(new Turtle(turt.pos, turt.dir, turt.depth));
                turt = stack[stack.length - 1];
                
            // BYE TURTLE
            } else if (this.grammar[i] == "]") {
                stack.pop();
                turt = stack[stack.length - 1];

            // NEW TURTLE PLUS FIRST BRIDGE STAIR
            } else if (this.grammar[i] == "(") {
                
                stack.push(new Turtle(turt.pos, turt.dir, turt.depth));
                turt = stack[stack.length - 1];

                // CALCULATING THE DIRECTION IN WHICH THE BRIDGE WILL BE DRAWN
                // Indices of rhe island positions
                let firstP: number = this.bridges[turt.depth].either();
                let secondP: number = this.bridges[turt.depth].other(firstP);
                // The island positions
                let start: vec3 = vec3.fromValues(this.islPos[firstP][0], 0, this.islPos[firstP][1]);
                let finish: vec3 = vec3.fromValues(this.islPos[secondP][0], 0, this.islPos[secondP][1]);

                // The line between them
                let line: vec3 = vec3.fromValues(0, 0, 0);
                vec3.subtract(line, finish, start);
                vec3.normalize(line, line);
                // and the location of the first bridge piece
                let stairPos = vec3.fromValues(line[0] * 0.9, line[1] * 0.9, line[2] * 0.9);
                vec3.add(stairPos, stairPos, start);

                turt.updatePos(stairPos, turt.depth);

                // Shifts direction
                let ang: number = vec3.angle(line, vec3.fromValues(0, 0, 1));
                
                let newDir = mat4.create();
                mat4.rotate(newDir, turt.dir, ang, vec3.fromValues(0, 1, 0));
                turt.updateDir(newDir);

                // FILLING VBO'S
                for (let j = 0; j < this.stairUp.idx.length; j++) {
                    this.indices.push(this.stairUp.idx[j] + numIDX);
                }
                for (let j = 0; j < this.stairUp.pos.length; j+= 3) {
                    let currNorm: vec4 = vec4.fromValues(this.stairUp.norms[j], 
                                                         this.stairUp.norms[j + 1], 
                                                         this.stairUp.norms[j + 2], 0);
                    vec4.transformMat4(currNorm, currNorm, turt.dir);
                    
                    this.normals.push(currNorm[0]);
                    this.normals.push(currNorm[1]);
                    this.normals.push(currNorm[2]);
                    this.normals.push(0.0);

                    let point: vec4 = vec4.fromValues(this.stairUp.pos[j] * 0.04, 
                                                      this.stairUp.pos[j + 1] * 0.04, 
                                                      this.stairUp.pos[j + 2] * -0.04, 1);
                    vec4.transformMat4(point, point, turt.dir);

                    this.positions.push(point[0] + turt.pos[0]);
                    this.positions.push(point[1]);
                    this.positions.push(point[2] + turt.pos[2]);
                    this.positions.push(1);

                    this.colors.push(112 / 255.0);
                    this.colors.push(70 / 255.0);
                    this.colors.push(42 / 255.0);
                    this.colors.push(1.0);
                }

                numIDX += this.stairUp.norms.length / 3;

                // Turtle adjustments
                let nextPos = vec3.fromValues(line[0] * 0.1, line[1] * 0.1, line[2] * 0.1);
                vec3.add(nextPos, nextPos, stairPos);
                turt.updatePos(nextPos, turt.depth);
                
            // EACH WALKWAY COMPONENT OF THE BRIDGE
            } else if (this.grammar[i] == "-") {
                // FILLING VBO'S
                for (let j = 0; j < this.bridge.idx.length; j++) {
                    this.indices.push(this.bridge.idx[j] + numIDX);
                }
                for (let j = 0; j < this.bridge.pos.length; j+= 3) {
                    let currNorm: vec4 = vec4.fromValues(this.bridge.norms[j], 
                                                         this.bridge.norms[j + 1], 
                                                         this.bridge.norms[j + 2], 0);
                    vec4.transformMat4(currNorm, currNorm, turt.dir);
                    
                    this.normals.push(currNorm[0]);
                    this.normals.push(currNorm[1]);
                    this.normals.push(currNorm[2]);
                    this.normals.push(0.0);

                    let point: vec4 = vec4.fromValues(this.bridge.pos[j] * 0.04, 
                                                      this.bridge.pos[j + 1] * 0.04, 
                                                      this.bridge.pos[j + 2] * -0.04, 1);
                    vec4.transformMat4(point, point, turt.dir);

                    this.positions.push(point[0] + turt.pos[0]);
                    this.positions.push(point[1]);
                    this.positions.push(point[2] + turt.pos[2]);
                    this.positions.push(1);

                    this.colors.push(112 / 255.0);
                    this.colors.push(70 / 255.0);
                    this.colors.push(42 / 255.0);
                    this.colors.push(1.0);
                }

                numIDX += this.bridge.norms.length / 3;

                // Indices of rhe island positions
                let firstP: number = this.bridges[turt.depth].either();
                let secondP: number = this.bridges[turt.depth].other(firstP);
                // The island positions
                let start: vec3 = vec3.fromValues(this.islPos[firstP][0], 0, this.islPos[firstP][1]);
                let finish: vec3 = vec3.fromValues(this.islPos[secondP][0], 0, this.islPos[secondP][1]);

                // The line between them
                let line: vec3 = vec3.fromValues(0, 0, 0);
                vec3.subtract(line, finish, start);
                vec3.normalize(line, line);

                // Turtle adjustments
                let nextPos = vec3.fromValues(line[0] * 0.1, line[1] * 0.1, line[2] * 0.1);
                vec3.add(nextPos, nextPos, turt.pos);
                turt.updatePos(nextPos, turt.depth);

            // ENDING BRIDGE STAIR PLUS BYE TURTLE
            } else if (this.grammar[i] == ")") {
                // FILLING VBO'S
                for (let j = 0; j < this.stairDown.idx.length; j++) {
                    this.indices.push(this.stairDown.idx[j] + numIDX);
                }
                for (let j = 0; j < this.stairDown.pos.length; j+= 3) {
                    let currNorm: vec4 = vec4.fromValues(this.stairDown.norms[j], 
                                                         this.stairDown.norms[j + 1], 
                                                         this.stairDown.norms[j + 2], 0);
                    vec4.transformMat4(currNorm, currNorm, turt.dir);
                    
                    this.normals.push(currNorm[0]);
                    this.normals.push(currNorm[1]);
                    this.normals.push(currNorm[2]);
                    this.normals.push(0.0);

                    let point: vec4 = vec4.fromValues(this.stairDown.pos[j] * 0.04, 
                                                      this.stairDown.pos[j + 1] * 0.04, 
                                                      this.stairDown.pos[j + 2] * -0.04, 1);
                    vec4.transformMat4(point, point, turt.dir);

                    this.positions.push(point[0] + turt.pos[0]);
                    this.positions.push(point[1]);
                    this.positions.push(point[2] + turt.pos[2]);
                    this.positions.push(1);

                    this.colors.push(112 / 255.0);
                    this.colors.push(70 / 255.0);
                    this.colors.push(42 / 255.0);
                    this.colors.push(1.0);
                }

                numIDX += this.stairDown.norms.length / 3;
                
                stack.pop();
                turt = stack[stack.length - 1];
                turt.updateDepth(turt.depth + 1);

            // DECIDES WHETHER OR NOT A HOUSE OR TREEWILL BE IN THIS LOCATION
            } else if (this.grammar[i] == "h") {

                let testLoc: vec3 = vec3.fromValues(turt.dir[12] + turt.pos[0], 0, turt.dir[14] + turt.pos[2]);
                let noiseTest: number = this.n.snoise(vec3.fromValues(testLoc[0], 0, testLoc[2])) / 100000000000;
                noiseTest = Math.sqrt(noiseTest);
                noiseTest = noiseTest * (turt.pos[1] * turt.pos[1] * 5);

                // IF HOUSE, DRAW FOUNDATION
                if (this.checkInBounds(testLoc) && noiseTest < 4) {

                    // Set Turtle values
                    turt.build = true;
                    if (Math.floor(noiseTest) % 3 == 0) { turt.tallBuild = true; }

                    // Determines house width:
                    turt.width = 0.8 - Math.max(0, noiseTest) * 0.2 + 0.75;

                    // FILLING VBO'S
                    for (let j = 0; j < this.house.idx.length; j++) {
                        this.indices.push(this.house.idx[j] + numIDX);
                    }
                    for (let j = 0; j < this.house.pos.length; j+= 3) {
                        let currNorm: vec4 = vec4.fromValues(this.house.norms[j], 
                                                            this.house.norms[j + 1], 
                                                            this.house.norms[j + 2], 0);
                        vec4.transformMat4(currNorm, currNorm, turt.dir);
                        
                        this.normals.push(currNorm[0]);
                        this.normals.push(currNorm[1]);
                        this.normals.push(currNorm[2]);
                        this.normals.push(0.0);

                        let point: vec4 = vec4.fromValues(this.house.pos[j] * 0.2 * turt.width, 
                                                        this.house.pos[j + 1] * 0.4 * turt.pos[1], 
                                                        this.house.pos[j + 2] * -0.2, 1);
                        vec4.transformMat4(point, point, turt.dir);

                        this.positions.push(point[0] + turt.pos[0]);
                        this.positions.push(point[1] + turt.pos[1]);
                        this.positions.push(point[2] + turt.pos[2]);
                        this.positions.push(1);

                        this.colors.push(255 / 255.0);
                        this.colors.push(255 / 255.0);
                        this.colors.push(0 / 255.0);
                        this.colors.push(1.0);
                    }

                    // Turtle adjustments
                    turt.updatePos(vec3.fromValues(turt.pos[0], 
                                                   turt.pos[1] + 0.4 * turt.pos[1], 
                                                   turt.pos[2]), turt.depth);
                    numIDX += this.house.norms.length / 3;

                // IF TREE, call function to draw
                } else if (this.checkInBounds(testLoc) && (noiseTest >= 6) && this.trees) {
                    turt.continue = false;
                    numIDX = this.addTree(numIDX, turt);

                // IF NOT, make sure nothing occurs with this turtle
                } else {
                    turt.continue = false;
                }

            // EACH STORY PER HOUSE, varies per type and per story
            } else if (this.grammar[i] == "s") {

                let testLoc: vec3 = vec3.fromValues(turt.dir[12] + turt.pos[0], 
                                                    0, turt.dir[14] + turt.pos[2]);

                if (this.checkInBounds(testLoc) && turt.continue) {
                    
                    // Assumes we are dealing with the more boring structures
                    let currShapeArray: any[] = this.sArray;
                    let currColArray: vec3[] = this.sColArray;
                    let sY = 0.75;
                    let scale = 0.2;
                    // Corrects if its actually Cool™
                    if (turt.tallBuild) { 
                        currShapeArray = this.rArray; 
                        currColArray = this.rColArray;
                        sY = 0.8;
                        scale = 0.23;
                    }

                    // Whether its the ground floor or middle floors
                    let currShape: any[] = currShapeArray[0];
                    if (turt.height > 0) {
                        currShape = currShapeArray[1];
                    }

                    /* Requires a loop since the Cooler™ structure 
                       has two OBJs and colors per floor*/
                    for (let i = 0; i < currShape.length; i++) {

                        // FILLING VBO'S
                        for (let j = 0; j < currShape[i].idx.length; j++) {
                            this.indices.push(currShape[i].idx[j] + numIDX);
                        }
                        for (let j = 0; j < currShape[i].pos.length; j+= 3) {
                            let currNorm: vec4 = vec4.fromValues(currShape[i].norms[j], 
                                                                currShape[i].norms[j + 1], 
                                                                currShape[i].norms[j + 2], 0);
                            vec4.transformMat4(currNorm, currNorm, turt.dir);
                            
                            this.normals.push(currNorm[0]);
                            this.normals.push(currNorm[1]);
                            this.normals.push(currNorm[2]);
                            this.normals.push(0.0);

                            let point: vec4 = vec4.fromValues(currShape[i].pos[j] * scale * turt.width, 
                                                            currShape[i].pos[j + 1] * scale,// * turt.pos[1], 
                                                            currShape[i].pos[j + 2] * -scale, 1);
                            vec4.transformMat4(point, point, turt.dir);

                            this.positions.push(point[0] + turt.pos[0]);
                            this.positions.push(point[1] + turt.pos[1]);
                            this.positions.push(point[2] + turt.pos[2]);
                            this.positions.push(1);

                            this.colors.push(currColArray[i][0]);
                            this.colors.push(currColArray[i][1]);
                            this.colors.push(currColArray[i][2]);
                            this.colors.push(1.0);
                        }
                        
                        numIDX += currShape[i].norms.length / 3;

                    }

                    // Rotates turtle for variation between stories
                    let newDir = mat4.create();
                    mat4.rotateY(newDir, turt.dir, Math.PI);
                    turt.updateDir(newDir);
                    turt.updatePos(vec3.fromValues(turt.pos[0], turt.pos[1] + sY * scale, turt.pos[2]), turt.depth);
                    turt.updateHeight(turt.height + 1);

                    // If keep building:
                    let noiseTest: number = this.n.snoise(vec3.fromValues(testLoc[0], turt.pos[1], testLoc[2])) / 100000000000;
                    noiseTest = Math.sqrt(noiseTest);
                    noiseTest = noiseTest * (turt.pos[1] * turt.pos[1] * 5);
                    
                    if (noiseTest < 4) { turt.continue = false; }
                } 

            // HOUSE ROOFS
            } else if (this.grammar[i] == "r") {

                // Noise used to determine whether a house has a roof
                let testLoc: vec3 = vec3.fromValues(turt.dir[12] + turt.pos[0], 0, turt.dir[14] + turt.pos[2]);
                let noiseTest: number = this.n.snoise(vec3.fromValues(testLoc[0], 0, testLoc[2])) / 100000000000;
                noiseTest = Math.sqrt(noiseTest);
                noiseTest = noiseTest * (turt.pos[1] * turt.pos[1] * 5);
                
                if (this.checkInBounds(testLoc) && turt.build && Math.floor(noiseTest) % 2 == 0) {

                    // Whether Cool™ structure or nah
                    let currShape: any[] = this.sArray[2];
                    let currColArray: vec3[] = this.sColArray;
                    let sY = 0.75;
                    let scale = 0.2;
                    if (turt.tallBuild) { 
                        currShape = this.rArray[2]; 
                        currColArray = this.rColArray;
                        sY = 0.8;
                        scale = 0.23;
                    }

                    for (let i = 0; i < currShape.length; i++) {
                        // FILLING VBO'S
                        for (let j = 0; j < currShape[i].idx.length; j++) {
                            this.indices.push(currShape[i].idx[j] + numIDX);
                        }
                        for (let j = 0; j < currShape[i].pos.length; j+= 3) {
                            let currNorm: vec4 = vec4.fromValues(currShape[i].norms[j], 
                                                                currShape[i].norms[j + 1], 
                                                                currShape[i].norms[j + 2], 0);
                            vec4.transformMat4(currNorm, currNorm, turt.dir);
                            
                            this.normals.push(currNorm[0]);
                            this.normals.push(currNorm[1]);
                            this.normals.push(currNorm[2]);
                            this.normals.push(0.0);

                            let point: vec4 = vec4.fromValues(currShape[i].pos[j] * scale * turt.width, 
                                                            currShape[i].pos[j + 1] * scale,// * turt.pos[1], 
                                                            currShape[i].pos[j + 2] * -scale, 1);
                            vec4.transformMat4(point, point, turt.dir);

                            this.positions.push(point[0] + turt.pos[0]);
                            this.positions.push(point[1] + turt.pos[1]);
                            this.positions.push(point[2] + turt.pos[2]);
                            this.positions.push(1);

                            this.colors.push(currColArray[i][0]);
                            this.colors.push(currColArray[i][1]);
                            this.colors.push(currColArray[i][2]);
                            this.colors.push(1.0);
                        }

                        numIDX += currShape[i].norms.length / 3;
                    }

                    turt.continue = false;
                }

            // SHIFTS TURTLE OUTWARD (used for house position from hill centers)
            } else if (this.grammar[i] == "<") {
                let newDir = mat4.create();
                mat4.translate(newDir, turt.dir, vec3.fromValues(0, turt.pos[1] * -0.35, 0.3));
                turt.updateDir(newDir);

            // ROTATES TURTLE
            } else if (this.grammar[i] == "+") {
                let newDir = mat4.create();
                mat4.rotateY(newDir, turt.dir, 2 * Math.PI / 5);
                turt.updateDir(newDir);

            // ROTATES TURTLE SLIGHTLY LESS
            } else if (this.grammar[i] == "*") {
                let newDir = mat4.create();
                mat4.rotateY(newDir, turt.dir, 2 * Math.PI / 9);
                turt.updateDir(newDir);
            }
        }
    }

    // From Drawable
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
    
        console.log(`Created city`);
    }
}