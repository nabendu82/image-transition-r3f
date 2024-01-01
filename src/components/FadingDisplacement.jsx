import { shaderMaterial, useTexture } from "@react-three/drei"
import { extend, useFrame } from "@react-three/fiber"
import { useRef, useState } from "react"
import * as THREE from "three"

export const ImageFadeMaterial = shaderMaterial(
    {
        distortionFactor: 1.2,
        displacementFactor: 0,
        tex: undefined,
        tex2: undefined,
        displacement: undefined
    },
    /*glsl*/` 
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
    /*glsl*/` 
        varying vec2 vUv;
        uniform sampler2D tex;
        uniform sampler2D tex2;
        uniform sampler2D displacement;
        uniform float displacementFactor;
        uniform float distortionFactor;

        uniform float rgbShiftAmount;
        uniform vec2 rgbShiftDirection;

        void main() {
            vec2 uv = vUv;
            vec4 displacement = texture2D(displacement, uv);
            vec2 distortedPosition = vec2(uv.x, uv.y + displacementFactor * (displacement.r*distortionFactor));
            vec2 distortedPosition2 = vec2(uv.x, uv.y - (1.0 - displacementFactor) * (displacement.r*distortionFactor));
            vec4 _texture = texture2D(tex, distortedPosition);
            vec4 _texture2 = texture2D(tex2, distortedPosition2);

            vec4 mixedTexture = mix(_texture, _texture2, displacementFactor);

            float r = texture2D(tex, uv + rgbShiftDirection * rgbShiftAmount).r;
            float g = mixedTexture.g;
            float b = texture2D(tex2, uv - rgbShiftDirection * rgbShiftAmount).b;

            gl_FragColor = vec4(r, g, b, 1.0);
            #include <tonemapping_fragment>
            #include <encodings_fragment>
    }`
)

extend({ ImageFadeMaterial })

export const FadingDisplacement = (props) => {
    const ref = useRef()
    const [texture1, texture2, dispTexture] = useTexture([
        "/textures/portrait2.jpg",
        "/textures/full_body2.jpg",
        "/textures/displacement/11.jpg"
    ])
    const [hovered, setHover] = useState(false)

    useFrame(() => {
        ref.current.displacementFactor = THREE.MathUtils.lerp(ref.current.displacementFactor, hovered ? 1 : 0, 0.01)
    })

    return (
        <mesh {...props} onPointerOver={(e) => setHover(true)} onPointerOut={(e) => setHover(false)}>
            <planeGeometry args={[2.25, 4]} />
            <imageFadeMaterial     rgbShiftAmount={ 0.0 }
    rgbShiftDirection={  new THREE.Vector2(1, 0) } ref={ref} tex={texture1} tex2={texture2} displacement={dispTexture} toneMapped={false} />
        </mesh>
    )
}