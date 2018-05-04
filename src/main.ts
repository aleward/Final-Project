import {vec2, vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
//import * as p5 from '../p5/addons/p5.sound'
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import Ray from './geometry/Ray';
import GodRays from './geometry/GodRays';
import Kelp from './geometry/Kelp';
import AllKelp from './geometry/AllKelp';
import Coral from './geometry/Coral';
import AllCoral from './geometry/AllCoral';
import Plane from './geometry/Plane';
import Particle from './geometry/Particle';
import {Shape} from './Shape';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';


// SOUND FEATURES
declare var uys7: any;
declare var brss: any;
declare var hyena: any;
declare var tuning: any;
declare var chord: any;
declare var tone: any;

declare var amp: any;
declare var fft: any;
declare var noteFFT: any;
declare var starFFT: any;

let currSound: any;
let notSet: boolean = true;
// declare var peaks: any;

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Camera Controls': 'Mouse',
  'Mode': 'Water',
  'Music': 'Shooting Stars by Bag Raiders', 
  'Pause': false
};

// Arrays for each feature type
let godrays: GodRays;
let kelps: AllKelp;
let coral: AllCoral;

// Environment helpers
let black: Plane; // to darken under sand
let sand: Plane;
let water: Plane;

// Particle system
let star: Square;
let particles: Particle[] = [];

// Deleted Chunk 1

function loadScene() {
  // FEATURE ARRAYS
  godrays = new GodRays(300);
  kelps = new AllKelp(300);
  coral = new AllCoral();

  // ENVIRONMENT ASPECTS
  sand = new Plane(vec3.fromValues(0, -40, 0), 200);
  sand.addColors(new Float32Array([102 / 255, 114 / 255, 89 / 255, 1,
                                   102 / 255, 114 / 255, 89 / 255, 1,
                                   102 / 255, 114 / 255, 89 / 255, 1,
                                   102 / 255, 114 / 255, 89 / 255, 1]));
  sand.create();
  sand.setNumInstances(1);

  black = new Plane(vec3.fromValues(0, -50, 0), 200);
  black.addColors(new Float32Array([0, 0, 0, 1,
                                   0, 0, 0, 1,
                                   0, 0, 0, 1,
                                   0, 0, 0, 1]));
  black.create();
  black.setNumInstances(1);

  water = new Plane(vec3.fromValues(0, 0, 0), 200);
  water.create();
  water.setNumInstances(1);

  // PARTICLES
  star = new Square();
  star.create();

  let offsetsArray = [];
  let colorsArray = [];
  // number of particles in each axis direction:
  let n: number = 25.0;

  // Deleted Chunk 2

  // Set up particles here.
  let partNum: number = 0;
  for(let i = 6 * n; i > -6 * n; i -= 12) {
    for(let j = n; j < 6 * n; j += 12) {
      for(let k = -6 * n; k < 6 * n; k += 9) {
        if (Math.random() < j / (6 * n)) {
          let particle = new Particle(vec3.fromValues(i, j, k));
          
          // The particle locations
          offsetsArray.push(i);
          offsetsArray.push(j);
          offsetsArray.push(k);

          // The particle colors
          colorsArray.push(particle.r / 255);
          colorsArray.push(particle.g / 255);
          colorsArray.push(particle.b / 255);
          colorsArray.push(1.0); // Alpha channel

          // Deleted Chunk 3

          particles.push(particle);
          partNum++;
        }
      }
    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  star.setInstanceVBOs(offsets, colors);
  star.setNumInstances(partNum); // psuedo grid of "particles"
}

// Function to update the particle VBO data
function starVBOUpdate() {
  let offsetsArray = [];
  let colorsArray = [];

  for(let i = 0; i < particles.length; i++) {
    offsetsArray.push(particles[i].pos[0]);
    offsetsArray.push(particles[i].pos[1]);
    offsetsArray.push(particles[i].pos[2]);
    
    colorsArray.push(particles[i].r / 255);
    colorsArray.push(particles[i].g / 255);
    colorsArray.push(particles[i].b / 255);
    colorsArray.push(1.0);
  }

  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  star.setInstanceVBOs(offsets, colors);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  var mouseOps = gui.add(controls, 'Camera Controls', ['Mouse', 'Music'] );
  var modeOps = gui.add(controls, 'Mode', ['Water', 'Stars'] );
  var songOps = gui.add(controls, 'Music', ['Shooting Stars by Bag Raiders', 'Hyena by Sam Gellaitry', 'UYS', 'Guitar Tuning', 'Plain Chord', 'Dial Tone'] );
  var pause = gui.add(controls, 'Pause');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(-100, -20, 0), vec3.fromValues(0, -30, 0));

  // RENDERING
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0, 0, 0, 1);
  gl.enable(gl.BLEND);
  // deal with blendFuncs within tick()

  const particleShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-frag.glsl')),
  ]);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const waterShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/water-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/water-frag.glsl')),
  ]);

  const kelpShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/kelp-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/kelp-frag.glsl')),
  ]);

  const coralShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/coral-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/coral-frag.glsl')),
  ]);

  // Takes the location of the mouse on the screen and adjusts it for world interaction
  function xyAdjust(event: any): vec3 {
    let x = event.clientX;
    let y = event.clientY;
    x = x - window.innerWidth / 2;
    y = (y - window.innerHeight / 2) * -1;
    x /= window.innerHeight * 0.9;
    y /= window.innerHeight * 0.9;
    x *= vec3.dist(camera.position, camera.target);
    y *= vec3.dist(camera.position, camera.target);
    return vec3.fromValues(x * camera.right[0] + y * camera.up[0], 
                           x * camera.right[1] + y * camera.up[1],
                           x * camera.right[2] + y * camera.up[2]);
  }

  // The method to halt camera movement and allow for mouse-particle interaction
  function mouseControl() {
    camera.controls.view.setUse(false);
        
    // clicked
    canvas.onmousedown = function(event) {
      // Mouse position:
      let clickPos = xyAdjust(event);

      // Left click
      if (event.button == 0) {
        vec3.add(Particle.mouseLoc, camera.target, clickPos);
        Particle.leftClick = true;
      }
      // Right click
      if (event.button == 2) {
        vec3.add(Particle.mouseLoc, camera.target, clickPos);
        Particle.mouseVec = camera.position;
        Particle.rightClick = true;
      }
    }

    // held
    canvas.onmousemove = function(event) {
      if (Particle.leftClick || Particle.rightClick) {
        // Mouse position:
        let clickPos = xyAdjust(event);
        // Update values
        vec3.add(Particle.mouseLoc, camera.target, clickPos);
        if (Particle.rightClick) {
          Particle.mouseVec = camera.position;
        }
      }
    }

    // unclicked
    canvas.onmouseup = function(event) {
      if (event.button == 0) {
        Particle.leftClick = false;
      }
      if (event.button == 2) {
        Particle.rightClick = false;
      }
    }
  }

  //mouseControl(); // first time
  camera.controls.view.setUse(true);
  let time = 0;

  // Frequencies for equal-tempered scale at the lowest octave:
  let baseFreq: number [] = [16.35, 17.32, 18.35, 19.45, 
                             20.60, 21.83, 23.12, 24.50, 
                             25.96, 27.50, 29.14, 30.87];
  // Analyzes the frequencies for each note at each octave
  function noteMap(fftAnalyze: number[], noteA: number[]) {
    for (let i = 0; i < 12; i++) {
      noteA[i] = 0.5;
    }
    let multiplier = 1;
    let divisors: number [] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 12; j++) {
        let val = noteFFT.getEnergy(baseFreq[j] * multiplier);
        // let plus = 0;
        // if (i > 0) { plus = (i / 20) * (i / 20); }
        if (val > 30) { divisors[j] += (0.5 - (i / 20) * (i / 20)); }
        noteA[j] += val / 255;
      }
      multiplier *= 2;
    }
    for (let i = 0; i < 12; i++) {
      noteA[i] /= divisors[i];
    }
  }

  // let printCount: number = 0;
  // let g = getAudioContext();
  // let ac: AudioContext;
  // Object.assign(g, ac);
  // ac.resume();
  // This function will be called every frame
  function tick() {
    pause.onChange(function(value: any) {
      // if ((typeof currSound === 'undefined')) {
      //   //uys7.loop();
      //   preload();
      //   setup();
      // }
      if (value = true && !(typeof currSound === 'undefined') && currSound.isLoaded() && currSound.isPlaying()) {
        currSound.pause();
      } else if (value = true && !(typeof currSound === 'undefined') && currSound.isLoaded() && currSound.isPaused()) {
        currSound.play();
      }
    })

    // KELP AND GOD RAY COLOR WARP---
    let lFreq: number = 0.5;
    let hFreq: number = 1;

    let noteAmp: number[] = [];

    if(notSet) {
      let check: boolean = typeof brss === 'undefined';
      // let checkPeak: boolean = typeof peaks === 'undefined';
      if (!check && brss.isLoaded() && brss.isPlaying()) {
        currSound = brss;
        notSet = false;
      }
      noteAmp = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    }

    if(!notSet) {
      songOps.onChange(function(value: any) {
        if (value == 'UYS') {
          currSound.stop();
          currSound = uys7;
          currSound.loop();
        } else if (value == 'Shooting Stars by Bag Raiders') {
          currSound.stop();
          currSound = brss;
          currSound.loop();
        } else if (value == 'Hyena by Sam Gellaitry') {
          currSound.stop();
          currSound = hyena;
          currSound.loop();
        } else if (value == 'Guitar Tuning') {
          currSound.stop();
          currSound = tuning;
          currSound.loop();
        } else if (value == 'Plain Chord') {
          currSound.stop();
          currSound = chord;
          currSound.loop();
        } else if (value == 'Dial Tone') {
          currSound.stop();
          currSound = tone;
          currSound.loop();
        } 
      })

      let check: boolean = typeof currSound === 'undefined';
      // let checkPeak: boolean = typeof peaks === 'undefined';
      if (!check && currSound.isLoaded() && currSound.isPlaying()) {
        let spectrum = fft.analyze();

        //God ray
        let lTot = 0;
        for (let i = 5; i < 15; i++) {
          lTot += spectrum[i];
        }
        lFreq = Math.max(lTot / (10 * 255) * 1.3 - 0.2, 0);
        //Kelp
        let rTot = 0;
        for (let i = 1; i < 15; i++) {
          rTot += spectrum[spectrum.length - i];
        }
        hFreq = rTot / (14 * 255)* 1.7 + 0.65;

        // Notes
        let noteSpec = noteFFT.analyze();
        noteMap(noteSpec, noteAmp);

        Particle.FFT = starFFT.analyze();
      } else {
        noteAmp = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      }
    }

    lambert.setAlph(lFreq);
    kelpShader.setAlph(hFreq);
    //-------------------------------

    coralShader.setNotes(noteAmp);
    

    // MODE OPTIONS
    modeOps.onChange(function(value: any) {})
    // Deleted Chunk 4

    // MOUSE OPTIONS
    mouseOps.onChange(function(value: any) {

      if (value == 'Mouse') {
        camera.controls.view.setUse(true);

        // Resets these function values for camera mode
        canvas.onmousedown = function(event) {}
        canvas.onmousemove = function(event) {}
        canvas.onmouseup = function(event) {}

      } else {
        // PARTICLE MODE
        mouseControl();
      }
    })
    
    camera.update();
    
    stats.begin();

    // Setting Times
    lambert.setTime(time);
    waterShader.setTime(time);
    kelpShader.setTime(time);
    coralShader.setTime(time);
    particleShader.setTime(time * 2);

    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    // RENDER
    renderer.clear();
    // Adjust blend
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.ONE, gl.ONE);
    // particles
    renderer.render(camera, particleShader, [
      star,
    ]);
    // Adjust blend again
    gl.enable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // opaque planes
    renderer.render(camera, lambert, [
      sand, black,
    ]);
    // kelp
    renderer.render(camera, kelpShader, kelps.kelps);
    // coral
    renderer.render(camera, coralShader, coral.notes);
    // transparent planes
    renderer.render(camera, waterShader, [
      water,
    ]);
    // Adjust blend one more time
    gl.blendFunc(gl.ONE, gl.ONE);
    // shine bright like a god ray
    renderer.render(camera, lambert, godrays.rays);
    stats.end();

    // Update all particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].setVals(time);
    }
    starVBOUpdate();

    time = time + 1;

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
