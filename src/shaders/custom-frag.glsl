#version 300 es

uniform highp float u_Time;

in highp vec3 fs_Pos;
in highp vec4 fs_Nor;
in highp vec4 fs_LightVec;

out highp vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

void main()
{
    // TODO Homework 4
    highp float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
    diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);
    highp float ambientTerm = 0.2;
    highp float lightIntensity = diffuseTerm + ambientTerm;

    out_Col = vec4(vec3(cos(u_Time * 0.1), 0.5 * (1.f - cos(u_Time * 0.1)),
                   0.75 * cos(u_Time * 0.1)) +
            vec3(0.3 * (1.f - cos(u_Time * 0.1)), 0.75 * (1.f - cos(u_Time * 0.1)),
                 1.f - cos(u_Time * 0.25)) *
            cos(2.f * 3.14159265359 * (vec3(0.8353, 0.549, 0.1765) * lightIntensity +
                vec3(0.511, 0.1176, 0.0902))), 1.f);
}
