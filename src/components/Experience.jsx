import { OrbitControls } from "@react-three/drei";
import { FadingDisplacement } from "./FadingDisplacement";
import { FadingImage } from "./FadingImage";
import {RGBDistortion} from "./RGBAndDistortionOnLoop";
import {RgbDisplacementTime} from "./RGBDisplacementTime";
import { BreathingRgb } from "./BreathingRgb";

export const Experience = ({analyser}) => {
  return (
    <>
      <OrbitControls />
      {/* <FadingDisplacement position-x={1.5} position-z={-2} /> */}
      <FadingImage analyser={analyser} position-x={0} />
      {/* <RGBDistortion/> */}
      {/* <RgbDisplacementTime position-x={2.5}/> */}
      {/* <BreathingRgb position-x={-2.5}/> */}
    </>
  );
};
