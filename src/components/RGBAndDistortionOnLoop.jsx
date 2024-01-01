import { shaderMaterial, useTexture } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

 const ImageFade2 = shaderMaterial(
  {
    distortionFactor: 1.2,
    displacementFactor: 0,
    imageTexture1: undefined,
    imageTexture2: undefined,
    imageDisplacement: undefined,
    rgbShiftAmount: 0.0,
    rgbShiftDirection: undefined,
  },
  /*glsl*/ ` 
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
  /*glsl*/ ` 
        varying vec2 vUv;
        uniform sampler2D imageTexture1;
        uniform sampler2D imageTexture2;
        uniform sampler2D imageDisplacement;
   
        uniform float displacementFactor;
        uniform float distortionFactor;

        uniform float rgbShiftAmount;
        uniform vec2 rgbShiftDirection;
        uniform float time;

        void main() {
            vec2 uv = vUv;
            vec4 imageDisplacement = texture2D(imageDisplacement, uv);
            vec2 distortedPosition = vec2(uv.x + displacementFactor * (imageDisplacement.r*distortionFactor), uv.y );
            vec2 distortedPosition2 = vec2(uv.x - (1.0 - displacementFactor) * (imageDisplacement.r*distortionFactor), uv.y);
            vec4 _texture = texture2D(imageTexture1, distortedPosition);
            vec4 _texture2 = texture2D(imageTexture1, distortedPosition2);
         
            vec4 mixedTexture = mix(_texture, _texture2, displacementFactor);

            float offset = (sin(time) + 1.0) * 1.5;

            float r = texture2D(imageTexture1, uv + rgbShiftDirection * rgbShiftAmount).r;
            float g = mixedTexture.g;
            float b = texture2D(imageTexture1, uv + rgbShiftDirection * rgbShiftAmount).b;

            gl_FragColor = vec4(r, g, b, 1.0);
            #include <tonemapping_fragment>
            #include <encodings_fragment>
    }`
);

extend({ ImageFade2 });

let startTime = Date.now();

const clock = new THREE.Clock();

export const RGBDistortion = (props) => {
  const ref = useRef();
  const [texture1, texture2, dispTexture] = useTexture([
    "/textures/portrait.jpg",
    "/textures/full_body.jpg",
    "/textures/displacement/2.jpeg",
  ]);
  const [hovered, setHover] = useState(false);

  useFrame(() => {
    let elapsedTime = (Date.now() - startTime) / 1000;
    let shiftMagnitude = 0.05 + 0.05 * Math.sin(elapsedTime);
    ref.current.displacementFactor =  THREE.MathUtils.lerp(ref.current.displacementFactor, shiftMagnitude, 0.05)
    ref.current.rgbShiftAmount = shiftMagnitude;
    ref.current.time = clock.getElapsedTime();
  });

  return (
    <mesh
      {...props}
      onPointerOver={(e) => setHover(true)}
      onPointerOut={(e) => setHover(false)}
    >
      <planeGeometry args={[2.25, 4]} />
      <imageFade2
        rgbShiftDirection={new THREE.Vector2(1, 0)}
        ref={ref}
        imageTexture1={texture1}
        imageTexture2={texture2}
        imageDisplacement={dispTexture}
        toneMapped={false}
      />
    </mesh>
  );
};
