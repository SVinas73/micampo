// Declaraciones de tipos para los add-ons de three (examples/jsm) que no
// incluyen sus propios .d.ts en esta versión.
declare module "three/examples/jsm/utils/SkeletonUtils.js" {
  import type { Object3D } from "three";
  export function clone(source: Object3D): Object3D;
}
