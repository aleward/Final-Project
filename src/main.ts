import {vec3} from 'gl-matrix';
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
  tesselations: 5,
  'Mouse Controls': 'Camera',
  'Load Scene': loadScene, // A function pointer, essentially
};

let square: Square;
let time: number = 0.0;
let particles: Particle[] = [];

let heart: Shape;

function loadScene() {
  square = new Square();
  square.create();

  heart = new Shape('heart.obj');

  // Set up particles here. Hard-coded example data for now
  let offsetsArray = [];
  let colorsArray = [];
  let n: number = 25.0;

  let hFreq: number = Math.floor((n * n * n) / heart.pos.length);
  let count: number = 0;
  for(let i = -1.5 * n; i < 1.5 * n; i+= 3) {
    for(let j = -1.5 * n; j < 1.5 * n; j+=3) {
      for(let k = -1.5 * n; k < 1.5 * n; k+=3) {
        let particle = new Particle(vec3.fromValues(i, j, k));
        
        offsetsArray.push(i);
        offsetsArray.push(j);
        offsetsArray.push(k);

        colorsArray.push(particle.r / 255);
        colorsArray.push(particle.g / 255);
        colorsArray.push(particle.b / 255);
        colorsArray.push(1.0); // Alpha channel

        if (count % hFreq == 0 && Math.floor(count / hFreq) < heart.pos.length) {
          particle.isMesh = true;
          particle.meshPos = heart.pos[Math.floor(count / hFreq)];
          console.log("s");
        }

        particles.push(particle);

        count++;
      }
    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(n * n * n); // 25x25x25 grid of "particles"
}

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
  var mouseFolder = gui.add(controls, 'Mouse Controls', ['Camera', 'Particle Motion'] );

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

  const camera = new Camera(vec3.fromValues(40, 30, 10), vec3.fromValues(5, 5, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-frag.glsl')),
  ]);

  let time = 0;
  let mouseEffect = false;

  // This function will be called every frame
  function tick() {
    mouseFolder.onChange(function(value: any) {
      if (value == 'Camera') {
        mouseEffect = false;
        camera.controls.view.setUse(true);
      } else {
        mouseEffect = true; 
        camera.controls.view.setUse(false);
      }
    })
    
    camera.update();
    if (mouseEffect) {
      canvas.onmousedown = function(event) {

        let x = event.clientX;
        let y = event.clientY;
        x = x - window.innerWidth / 2;
        y = (y - window.innerHeight / 2) * -1;
        x /= window.innerHeight;
        y /= window.innerHeight;
        x *= vec3.dist(camera.position, camera.target);
        y *= vec3.dist(camera.position, camera.target);

        let clickPos = vec3.fromValues(x * camera.right[0] + y * camera.up[0], 
                                       x * camera.right[1] + y * camera.up[1],
                                       x * camera.right[2] + y * camera.up[2]);

        console.log(clickPos);

        if (event.button == 0) {
          vec3.add(Particle.mouseLoc, camera.target, clickPos);
          Particle.leftClick = true;
        }
        if (event.button == 2) {
          vec3.add(Particle.mouseLoc, camera.target, clickPos);
          vec3.add(Particle.mouseVec, Particle.mouseLoc, camera.position);
          Particle.rightClick = true;
        }
      }

      canvas.onmousemove = function(event) {
        if (Particle.leftClick || Particle.rightClick) {
          let x = event.clientX;
          let y = event.clientY;
          x = x - window.innerWidth / 2;
          y = (y - window.innerHeight / 2) * -1;
          x /= window.innerHeight;
          y /= window.innerHeight;
          x *= vec3.dist(camera.position, camera.target);
          y *= vec3.dist(camera.position, camera.target);

          let clickPos = vec3.fromValues(x * camera.right[0] + y * camera.up[0], 
                                         x * camera.right[1] + y * camera.up[1],
                                         x * camera.right[2] + y * camera.up[2]);
          vec3.add(Particle.mouseLoc, camera.target, clickPos);
          if (Particle.rightClick) {
            vec3.add(Particle.mouseVec, Particle.mouseLoc, camera.position);
          }
        }
      }

      canvas.onmouseup = function(event) {
        if (event.button == 0) {
          Particle.leftClick = false;
        }
        if (event.button == 2) {
          Particle.rightClick = false;
        }
      }
    }
    
    stats.begin();
    lambert.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    renderer.clear();
    renderer.render(camera, lambert, [
      square,
    ]);
    stats.end();

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
