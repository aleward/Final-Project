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

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 6,
  'Ground Color': [0, 255, 0],
  Motion: true,
  Clouds: true,
  'Load Scene': loadScene, // A function pointer, essentially
};

let cube: Cube;
let icosphere: Icosphere;
let square: Square;

// Rotation Matrix function made by Neil Mendoza 1/11/13, adjusted to javascript
function rotationMatrix(axis1: vec3, angle: number)
{
  let axis = vec3.fromValues(0.0, 0.0, 0.0);
  vec3.normalize(axis, axis1);
  let s = Math.sin(angle);
  let c = Math.cos(angle);
  let oc = 1.0 - c;
        
  return mat4.fromValues(oc * axis[0] * axis[0] + c,            oc * axis[0] * axis[1] - axis[2] * s,  oc * axis[2] * axis[0] + axis[1] * s,  0.0,
                         oc * axis[0] * axis[1] + axis[2] * s,  oc * axis[1] * axis[1] + c,            oc * axis[1] * axis[2] - axis[0] * s,  0.0,
                         oc * axis[2] * axis[0] - axis[1] * s,  oc * axis[1] * axis[2] + axis[0] * s,  oc * axis[2] * axis[2] + c,            0.0,
                         0.0,                                   0.0,                                   0.0,                                   1.0);
}

function loadScene() {
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
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
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const moonmoon = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/moon1-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/moon1-frag.glsl')),
  ]);

  const planet = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/planet-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/planet-frag.glsl')),
  ]);

  const clouds = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/cloud-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/cloud-frag.glsl')),
  ]);

  const custom = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);

  // Add controls to the gui
  const gui = new DAT.GUI();
  var tess = gui.add(controls, 'tesselations', 0, 8).step(1);
  
  var planetFolder = gui.addFolder('Planet');
  var colControl = planetFolder.addColor(controls, 'Ground Color');
  var pMotionCont = planetFolder.add(controls, 'Motion');
  var cloudCont = planetFolder.add(controls, 'Clouds');

  var mmFolder = gui.addFolder('Moon Moon');
  var mmMotionCont = mmFolder.add(controls, 'Motion');

  planetFolder.open();
  mmFolder.open();
  gui.add(controls, 'Load Scene');

  let currColor = vec4.fromValues(0, 1, 0, 1);
  let time = 0;
  let mmTime = 0;
  let mmMotion = true;
  let pTime = 0;
  let pMotion = true;
  let isClouds = true;

  // FOR MOONMOON
  let moon1Translation = mat4.fromValues(1.0,  0.0,  0.0,  0.0,
                                    0.0,  1.0,  0.0,  0.0,
                                    0.0,  0.0,  1.0,  0.0,
                                    2.3,  2.3,  2.3,  1.0);

  let moon1Scale = mat4.fromValues(0.5,  0.0,  0.0,  0.0,
                              0.0,  0.5,  0.0,  0.0,
                              0.0,  0.0,  0.5,  0.0,
                              0.0,  0.0,  0.0,  1.0);

  // let currShader = moonmoon;

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    tess.onChange(function(value: any){
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, value);
      icosphere.create();
    })
    colControl.onChange(function(value: any) {
      currColor = vec4.fromValues(value[0] / 255.0, value[1] / 255.0, value[2] / 255.0, 1);
    })

    let mmModelMat = mat4.create();
    mat4.multiply(mmModelMat, moon1Scale, rotationMatrix(vec3.fromValues(0.0, 1.0, 0.), Math.PI * mmTime / 180.0));
    mat4.multiply(mmModelMat, moon1Translation, mmModelMat);
    mat4.multiply(mmModelMat, rotationMatrix(vec3.fromValues(-1.0, 1.0, 1.0), mmTime / 100.0), mmModelMat);
    mmMotionCont.onChange(function(value: boolean){
      mmMotion = value;
    })
    if (mmMotion) mmTime = mmTime + 1;

    let pModelMat = rotationMatrix(vec3.fromValues(-1.3, 1.0, 1.0), pTime / 150.0);
    let cModelMat = rotationMatrix(vec3.fromValues(-1.3, 1.0, 1.0), pTime / 250.0);
    pMotionCont.onChange(function(value: boolean){
      pMotion = value;
    })
    if (pMotion) pTime = pTime + 1;

    cloudCont.onChange(function(value: boolean){
      isClouds = value;
    })

    renderer.render(camera, moonmoon, mmModelMat, currColor, time, [
      icosphere,
    ]);
    renderer.render(camera, planet, pModelMat, currColor, time, [
      icosphere,
    ]);
    if(isClouds) {
      renderer.render(camera, clouds, cModelMat, currColor, time, [
        icosphere,
      ]);
    }
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
