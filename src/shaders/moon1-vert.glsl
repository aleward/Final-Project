#version 300 es

//This is a vertex shader. While it is called a "shader" due to outdated conventions, this file
//is used to apply matrix transformations to the arrays of vertex data passed to it.
//Since this code is run on your GPU, each vertex is transformed simultaneously.
//If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.
//This simultaneous transformation allows your program to run much faster, especially when rendering
//geometry with millions of vertices.

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself

uniform float u_Time;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Pos;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.




// The following three functions are "Simplex 3D Noise" by Ian McEwan, Ashima Arts:

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}


// Rotation Matrix function made by Neil Mendoza 1/11/13
mat4 rotationMatrix(vec3 axis1, float angle)
{
    vec3 axis = normalize(axis1);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}


// Combines noise at six different octives (based on my Terrain from CIS460)
float iterations(vec3 nTemp) {
    float value = 0.0;
    float amp = .5;
    vec3 shift = vec3(100.0);
    vec3 dir = normalize(vec3(1.f, 1.f, 1.f));
    mat4 rot = rotationMatrix(dir, 0.5);

    vec3 n = nTemp * 1.5;

    for (float i = 0.f; i < 4.f; i++) {
        value += amp * snoise(n);
        vec4 forRotation = rot * vec4(n.x, n.y, n.z, 1.f);
        n = vec3(forRotation.x, forRotation.y, forRotation.z) * 2.f + shift;
        amp*= .5;
    }
    return value;
}


// Moon specific deformation of noise
vec4 moonWarp(vec4 v, vec4 displacement) {
    float n = iterations(v.xyz);
    if (n < 0.f) n = 0.f;
    n = sqrt(sqrt(n));

    return v - (displacement * n * 0.15);
}

void main()
{

    mat3 invTranspose = mat3(u_ModelInvTr);

    fs_Pos = vs_Pos;
    vec4 newPos = moonWarp(vs_Pos, vs_Nor); // Deformed vertices


    // ------ CALCULATES NORMALS BASED ON SURROUNDING NOISE ------

    vec4 compPos1; // an approximation of one nearby position on the sphere
    vec4 compPos2; // ananother position

    // Uses cross products to get direction; different possibilities to avoid mathematical error
    if (abs(dot(vs_Nor, vec4(1.f, 0.f, 0.f, 0.f))) <= 0.5) {
        compPos1 = vec4(normalize(vs_Pos.xyz + vec3(0.003, 0.f, 0.f)), 1.f);
        if (abs(dot(vs_Nor, vec4(0.f, 1.f, 0.f, 0.f))) <= 0.5) {
            compPos2 = vec4(normalize(vs_Pos.xyz + vec3(0.f, 0.003f, 0.f)), 1.f);
        } else {
            compPos2 = vec4(normalize(vs_Pos.xyz + vec3(0.f, 0.f, 0.003f)), 1.f);
        }
    } else {
        compPos1 = vec4(normalize(vs_Pos.xyz + vec3(0.f, 0.003f, 0.f)), 1.f);
        compPos2 = vec4(normalize(vs_Pos.xyz + vec3(0.f, 0.f, 0.003f)), 1.f); 
    }

    // Vectors from the nearby points to the current vertex:
    vec4 compVec1 = moonWarp(compPos1, compPos1) - newPos; 
    vec4 compVec2 = moonWarp(compPos2, compPos2) - newPos;

    vec3 newNorm = normalize(cross(normalize(compVec1.xyz), normalize(compVec2.xyz)));

    if (dot(newNorm, vs_Nor.xyz) < 0.f) newNorm = newNorm * -1.f; // corrects the general normal direction

    // mat4 turning = rotationMatrix(vec3(0.f, 1.f, 0.f), radians(u_Time));
    
    vec4 modelposition = u_Model * newPos;   // Temporarily store the transformed vertex positions for use below

    fs_Nor = vec4(invTranspose * newNorm, 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.

    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
    float thisNoise = iterations(vs_Pos.xyz);
    if (thisNoise < 0.f) thisNoise = 0.f;
    thisNoise = sqrt(sqrt(thisNoise));
    fs_Col = vec4(thisNoise, thisNoise, thisNoise, 1.f);                         // Pass the vertex colors to the fragment shader for interpolation
}
