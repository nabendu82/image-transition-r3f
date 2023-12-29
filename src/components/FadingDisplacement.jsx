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
        void main() {
            vec2 uv = vUv;
            vec4 displacement = texture2D(displacement, uv);
            vec2 distortedPosition = vec2(uv.x, uv.y + displacementFactor * (displacement.r*distortionFactor));
            vec2 distortedPosition2 = vec2(uv.x, uv.y - (1.0 - displacementFactor) * (displacement.r*distortionFactor));
            vec4 _texture = texture2D(tex, distortedPosition);
            vec4 _texture2 = texture2D(tex2, distortedPosition2);
            vec4 finalTexture = mix(_texture, _texture2, displacementFactor);
            gl_FragColor = finalTexture;
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
        ref.current.displacementFactor = THREE.MathUtils.lerp(ref.current.displacementFactor, hovered ? 1 : 0, 0.055)
    })

    return (
        <mesh {...props} onPointerOver={(e) => setHover(true)} onPointerOut={(e) => setHover(false)}>
            <planeGeometry args={[2.25, 4]} />
            <imageFadeMaterial ref={ref} tex={texture1} tex2={texture2} displacement={dispTexture} toneMapped={false} />
        </mesh>
    )
}