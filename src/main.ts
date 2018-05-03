import {vec2, vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
//import * as p5 from '../p5/addons/p5.sound'
import Square from './geometry/Square';
import Ray from './geometry/Ray';
import Plane from './geometry/Plane';
import Particle from './geometry/Particle';
import {Shape} from './Shape';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';


// SOUND FEATURES
declare var uys7: any;
declare var amp: any;
declare var fft: any;

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Camera Controls': 'Mouse',
  'Mode': 'Water'
};
let ray: Ray;
let black: Plane;
let sand: Plane;
let water: Plane;

let star: Square;
let time: number = 0.0;
let particles: Particle[] = [];

// Deleted Chunk 1

function loadScene() {
  ray = new Ray(vec3.fromValues(0, 125, 0), 0, vec3.fromValues(0, -40, 0));
  ray.create();
  ray.setNumInstances(1);

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

  star = new Square();
  star.create();

  // PARTICLES
  let offsetsArray = [];
  let colorsArray = [];
  // number of particles in each axis direction:
  let n: number = 25.0;

  // Deleted Chunk 2

  // Set up particles here.
  let partNum: number = 0;
  for(let i = 6 * n; i > -6 * n; i -= 12) {
    for(let j = n; j < 6 * n; j += 12) {
      for(let k = -6 * n; k < 6 * n; k += 12) {
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
  star.setNumInstances(partNum); // 10x10 grid of "particles"
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
  var modeOps = gui.add(controls, 'Mode', ['Water'] );

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

  const camera = new Camera(vec3.fromValues(-100, -10, 0), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0, 0, 0, 1);
  gl.enable(gl.BLEND);
  // gl.blendFunc(gl.ONE, gl.ONE); // Additive blending
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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

  // let printCount: number = 0;

  // This function will be called every frame
  function tick() {
    
    // let check: boolean = typeof uys7 === 'undefined';
    // if (!check && uys7.isLoaded() && (printCount < 500)) {
    //   if (printCount > 480) {
    //     console.log(fft.analyze());
    //     console.log(amp.getLevel());
    //   }
    //   printCount++;
    // }

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
    lambert.setTime(time);
    waterShader.setTime(time);
    particleShader.setTime(time * 2);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    renderer.clear();
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.ONE, gl.ONE);
    renderer.render(camera, particleShader, [
      star,
    ]);
    gl.enable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    renderer.render(camera, lambert, [
      ray, sand, black,
    ]);
    renderer.render(camera, waterShader, [
      water,
    ]);
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
