#version 300 es

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

in vec4 vs_Pos;
in vec4 vs_Nor;

out vec3 fs_Pos;
out vec4 fs_Nor;
out vec4 fs_LightVec;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.

void main()
{
    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);  

    float change = 3.f / sqrt(vs_Pos.x * vs_Pos.x + vs_Pos.z * vs_Pos.z);
    float chX = vs_Pos.x * change - vs_Pos.x;
    float chZ = vs_Pos.z * change - vs_Pos.z;
    vec4 changePos = vs_Pos + vec4(chX * (cos(u_Time * 0.1) + 1.f) / 2.f,
                                   0.f, chZ * (cos(u_Time * 0.1) + 1.f) / 2.f, 0.f);
    // moves all the vertices to be 3 units from the y - axis

    vec4 modelposition = u_Model * changePos;   // Temporarily store the transformed vertex positions for use below

    fs_Pos = vec3(modelposition);

    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices

}
