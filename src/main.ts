import {vec2, vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Particle from './geometry/Particle';
import {Shape} from './Shape';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Mouse Controls': 'Particle Motion',
  'Shapes': 'None'
};

let square: Square;
let time: number = 0.0;
let particles: Particle[] = [];

let meshes: Shape[] = [];
let mods: number[] = []
let heart: Shape;
let popplio: Shape;
let wahoo: Shape;
let cow: Shape;
let greenWahoo: Shape;
let rose: Shape;
let sunflower: Shape;
let apple: Shape;

function loadScene() {
  square = new Square();
  square.create();

  // PARTICLES
  let offsetsArray = [];
  let colorsArray = [];
  // number of particles in each axis direction:
  let n: number = 25.0;

  // Setting up the mesh values
  heart = new Shape('heart.obj', 10);
  popplio = new Shape('popplio.obj', 10);
  wahoo = new Shape('wahoo.obj', 10);
  greenWahoo = new Shape('greenWahoo.obj', 10);
  cow = new Shape('cow.obj', 8);
  rose = new Shape('rose.obj', 1);
  sunflower = new Shape('sunflower.obj', 0.7);
  apple = new Shape('apple.obj', 10);
  meshes.push(heart);
  meshes.push(popplio);
  meshes.push(wahoo);
  meshes.push(cow);
  meshes.push(greenWahoo);
  meshes.push(rose);
  meshes.push(sunflower);
  meshes.push(apple);

  // Values that track which meshes effect which particles
  for (let i = 0; i < meshes.length; i++) {
    mods.push(Math.max(1, Math.floor((n * n * n) / meshes[i].pos.length)));
  }
  let count: number = 0;

  // Set up particles here.
  for(let i = 3 * n; i > -3 * n; i -= 6) {
    for(let j = -3 * n; j < 3 * n; j += 6) {
      for(let k = -3 * n; k < 3 * n; k += 6) {
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

        // The meshes
        for (let i = 0; i < meshes.length; i++) {
          if (count % mods[i] == 0 && Math.floor(count / mods[i]) < meshes[i].pos.length) {
            particle.isMesh[i] = true;
            particle.meshPos[i] = meshes[i].pos[Math.floor(count / mods[i])];
          } else {
            if (mods[i] == 1) {
              particle.isMesh[i] = true;
              particle.meshPos[i] = vec3.fromValues(0, 0, 0);
            } else {
              particle.isMesh[i] = false;
            }
          }
        }

        particles.push(particle);
        count++;
      }
    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(n * n * n); // 10x10 grid of "particles"
}

// Function to update the particle VBO data
function squareVBOUpdate() {
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
  square.setInstanceVBOs(offsets, colors);
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
  var mouseOps = gui.add(controls, 'Mouse Controls', ['Camera', 'Particle Motion'] );
  var shapeOps = gui.add(controls, 'Shapes', ['None', 'Heart', 'Apple', 'Rose', 
                                              'Sunflower', 'Popplio', 'Wahoo', 'Green Wahoo'] );

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

  const camera = new Camera(vec3.fromValues(-100, 10, 10), vec3.fromValues(5, 5, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0, 0, 0, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-frag.glsl')),
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

  mouseControl(); // first time
  let time = 0;

  // This function will be called every frame
  function tick() {
    // SHAPE OPTIONS
    shapeOps.onChange(function(value: any) {
      if (value == 'None') {
        Particle.meshMode = -1;
      } else if (value == 'Heart') {
        Particle.meshMode = 0;
      } else if (value == 'Popplio') {
        Particle.meshMode = 1;
      } else if (value == 'Wahoo') {
        Particle.meshMode = 2;
      } else if (value == 'Cow') {
        Particle.meshMode = 3;
      } else if (value == 'Green Wahoo') {
        Particle.meshMode = 4;
      } else if (value == 'Rose') {
        Particle.meshMode = 5;
      } else if (value == 'Sunflower') {
        Particle.meshMode = 6;
      } else if (value == 'Apple') {
        Particle.meshMode = 7;
      }
    })

    // MOUSE OPTIONS
    mouseOps.onChange(function(value: any) {

      if (value == 'Camera') {
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
    lambert.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    renderer.clear();
    renderer.render(camera, lambert, [
      square,
    ]);
    stats.end();

    // Update all particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].setVals(time);
    }
    squareVBOUpdate();

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
