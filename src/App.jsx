import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import React, { useRef, useMemo, Suspense } from "react";
import { EffectComposer, SSAO, Bloom  } from '@react-three/postprocessing'
import { BlurPass, Resizer, KernelSize, Resolution } from 'postprocessing'



function App() {
  return (
    <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
      <color attach="background" args={["black"]} />
      <Experience />
    </Canvas>
  );
}

export default App;
