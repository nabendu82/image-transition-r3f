import { shaderMaterial, useTexture } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";

const clock = new THREE.Clock();

export const ImageFade = shaderMaterial(
  {
    distortionFactor: 1.2,
    displacementFactor: 0,
    imageTexture1: undefined,
    imageTexture2: undefined,
    imageDisplacement: undefined,
    rgbShiftAmount: 0.0,
    mouseSpeed: 0.0,
    rgbShiftDirection: undefined,
    time: clock.getElapsedTime(),
  },
  /*glsl*/ ` 
        varying vec2 vUv;
        vec3 mod289(vec3 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
          }
          
          vec4 mod289(vec4 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
          }
          
          vec4 permute(vec4 x) {
            return mod(((x * 34.0) + 1.0) * x, 289.0);
        }
        
        vec4 taylorInvSqrt(vec4 r) {
            return 1.79284291400159 - 0.85373472095314 * r;
        }
        
        float snoise(vec3 v) { 
            const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
            // First corner
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
        
            // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
        
            // x0 = x0 - 0.0 + 0.0 * C.xxx;
            // x1 = x0 - i1  + 1.0 * C.xxx;
            // x2 = x0 - i2  + 2.0 * C.xxx;
            // x3 = x0 - 1.0 + 3.0 * C.xxx;
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy; // 2.0 * C.x = 1/3 = C.y
            vec3 x3 = x0 - D.yyy;      // -1.0 + 3.0 * C.x = -0.5 = -D.y
        
            // Permutations
            i = mod289(i); 
            vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                                     + i.y + vec4(0.0, i1.y, i2.y, 1.0)) 
                                     + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
            // Gradients
            float n_ = 0.142857142857; // 1.0 / 7.0
            vec3  ns = n_ * D.wyz - D.xzx;
        
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z); // mod(p,7*7)
        
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
        
            vec4 x = x_ * ns.x + ns.yyyy;
            vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
        
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
        
            vec4 s0 = floor(b0) * 2.0 + 1.0;
            vec4 s1 = floor(b1) * 2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
        
            vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
        
            // Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
        
            // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }
          
          
          
        uniform float time;
        uniform float mouseSpeed;

        void main() {
            vUv = uv;

            // Parameters for noise and deformation
            float noiseScale = 0.75;
            float deformationScale = 0.35;

            float speedFactor = mix(1.0, 2.0, clamp(mouseSpeed, 0.0, 5.0)); // You can adjust these values
         
        
            // Calculate noise-based displacement
            float displacement = snoise(position * noiseScale + vec3(time, time, time)) * deformationScale;
            displacement = smoothstep(0.0, 1.2, displacement) * deformationScale;

            float displacement2 = displacement * speedFactor;
        
            // Apply displacement along the normal vector
            vec3 deformedPosition = position + normal * displacement;
            deformedPosition.y += displacement2 * (mouseSpeed * 0.05); // 'someFactor' controls the elongation
         
        
            gl_Position = projectionMatrix * modelViewMatrix * vec4(deformedPosition, 1.0);
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

      float brightness = dot(_texture.rgb, vec3(0.3, 0.59, 0.11));
      vec4 emissiveColor = vec4(r, g, b * brightness * 500.0, 1.0);

      gl_FragColor = mix(_texture, emissiveColor, 0.5); 
      #include <tonemapping_fragment>
      #include <encodings_fragment>
}`
);

extend({ ImageFade });

function calculateAverage(array) {
    // Sum up all elements using reduce
    const sum = array.reduce((acc, val) => acc + val, 0);
  
    // Divide the sum by the number of elements
    return sum / array.length;
  }

let startTime = Date.now();

export const FadingImage = (props) => {
    let lastMousePosition = { x: 0, y: 0 };
    const [mouseSpeed, setMouseSpeed] = useState(0);
    const mouseFrames = [];

    const calculateMouseSpeed = (event) => {
        const distance = Math.sqrt(
            Math.pow(event.clientX - lastMousePosition.x, 2) +
            Math.pow(event.clientY - lastMousePosition.y, 2)
        );
        mouseFrames.push(distance);
        if(mouseFrames.length > 50 ) mouseFrames.shift();

     
        setMouseSpeed(calculateAverage(mouseFrames));
        lastMousePosition = { x: event.clientX, y: event.clientY };
    };

    useEffect(() => {
        window.addEventListener('mousemove', calculateMouseSpeed);
        return () => {
            window.removeEventListener('mousemove', calculateMouseSpeed);
        };
    }, []);

  const ref = useRef();
  const meshRef = useRef();
  const sphereRef = useRef();
  const { camera } = useThree();
  const [texture1, texture2, dispTexture] = useTexture([
    "/textures/galaxy.jpg",
    "/textures/galaxy.jpg",
    "/textures/displacement/2.jpeg",
  ]);
  const [hovered, setHover] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  useFrame(() => {
    // let elapsedTime = (Date.now() - startTime) / 1000;
    // let shiftMagnitude = 0.05 + 0.05 * Math.sin(elapsedTime);
    // ref.current.displacementFactor =  THREE.MathUtils.lerp(ref.current.displacementFactor, shiftMagnitude, 0.05)
    // ref.current.rgbShiftAmount = shiftMagnitude;
    // ref.current.time =  Math.sin(clock.getElapsedTime());
    // const vector = new THREE.Vector3(mousePosition.x, mousePosition.y, 0.5);
    // vector.unproject(camera);
    // meshRef.current.position.x = mousePosition.x;
    // meshRef.current.position.y = mousePosition.y;
    // meshRef.current.position.z = mousePosition.z;

    const planeNormal = new THREE.Vector3(0, 0, -1); // Facing towards the camera
    planeNormal.applyQuaternion(camera.quaternion);

    const planePoint = camera.position
      .clone()
      .add(planeNormal.clone().multiplyScalar(10)); // Positioned 10 units in front of the camera
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      planePoint
    );

    // Create a ray from the camera through the mouse position
    const mouseVector = new THREE.Vector3(
      mousePosition.x,
      mousePosition.y,
      0.5
    );
    mouseVector.unproject(camera);
    const raycaster = new THREE.Raycaster(
      camera.position,
      mouseVector.sub(camera.position).normalize()
    );

    // Calculate the intersection point with the plane
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    // Update the sphere's position
    if (intersectPoint) {
      meshRef.current.position.lerp(intersectPoint, 0.1); // Smooth transition
    }

    let elapsedTime = (Date.now() - startTime) / 1000;
    let shiftMagnitude = 0.05 + 0.05 * Math.sin(elapsedTime);

    ref.current.displacementFactor = THREE.MathUtils.lerp(
      ref.current.displacementFactor,
      shiftMagnitude,
      0.5
    );
    ref.current.rgbShiftAmount = shiftMagnitude * 2.0;
    ref.current.time = clock.getElapsedTime();
    ref.current.mouseSpeed = mouseSpeed * 10.0;




    // console.log(sphereRef);
    // if(sphereRef.current){
    



    //     console.log(mouseSpeed);

    //     // Scale the sphere based on the speed. 
    //     // When the speed is 0, it returns to a regular sphere (scale of 1).
    //     meshRef.current.scale.y =  THREE.MathUtils.lerp(
    //         ref.current.displacementFactor,
    //         mouseSpeed,
    //         1.0
    //       );
    // }
   
  });

  return (
    <EffectComposer>
      <mesh
        ref={meshRef}
        {...props}
        onPointerOver={(e) => setHover(true)}
        onPointerOut={(e) => setHover(false)}
        castShadow
        receiveShadow
      >
        <sphereGeometry ref={sphereRef} args={[1.0, 32, 32]} />
        <imageFade
          rgbShiftDirection={new THREE.Vector2(1, 0)}
          ref={ref}
          imageTexture1={texture1}
          imageTexture2={texture2}
          imageDisplacement={dispTexture}
          toneMapped={false}
        />
      </mesh>
      <Bloom luminanceThreshold={-0.1} luminanceSmoothing={2.9} height={300} />
    </EffectComposer>
  );
};
