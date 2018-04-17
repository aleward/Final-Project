import {vec3} from 'gl-matrix';
import {mat4, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Cube from './geometry/Cube';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import LSystem from './LSystem';
import {City} from './City';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Expansions: 6,
  'Water Amount': 4,
  'Trees?': true
};

let city: City;

// Creates a city
function loadScene(expands: number, waterAmount: number, trees: boolean) {
  city = new City(waterAmount * 100, trees);
  for (let i = 0; i < expands; i++) {
    city.expGram();
  }
  city.parseGram();
  city.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // Sets the value of `gl` in the `globals.ts` module.
  setGL(gl);

  // Initial call to load scene
  loadScene(6, 3, true);

  const camera = new Camera(vec3.fromValues(-0.85, 0.9, 3), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  // Add controls to the gui
  const gui = new DAT.GUI();
  var exp = gui.add(controls, 'Expansions', 0, 20).step(1);
  var watVal = gui.add(controls, 'Water Amount', 0, 8).step(1);
  var treeVal = gui.add(controls, 'Trees?');

  // Necessary values for creation / rendering
  let currExpands = 6;
  let currWater = 3;
  let currTrees = true;
  let currColor = vec4.fromValues(0, 107 / 255.0, 37 / 255.0, 1);
  let time = 0;

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    // Changes the number of expansions (of the city grammar)
    exp.onChange(function(value: any){
      loadScene(value, currWater, currTrees);
      currExpands = value;
    })

    // Changes the water level / liklihood of land
    watVal.onChange(function(value: any){
      loadScene(currExpands, value, currTrees);
      currWater = value;
    })

    // Whether to draw trees
    treeVal.onChange(function(value: any){
      loadScene(currExpands, currWater, value);
      currTrees = value;
    })

    renderer.render(camera, lambert, currColor, time, [
      city
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    time = time + 1;
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
