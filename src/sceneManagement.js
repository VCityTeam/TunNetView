import { Scene } from 'three';

export function createTopScene(itownsView) {
  /** @type {Scene} */
  const topScene = new Scene();
  itownsView.mainLoop.gfxEngine.renderer.autoClear = false;
  itownsView.render = () => {
    itownsView.mainLoop.gfxEngine.renderer.clear(); // clear buffers
    itownsView.mainLoop.gfxEngine.renderer.render(
      itownsView.scene,
      itownsView.camera.camera3D
    ); // render scene 1
    itownsView.mainLoop.gfxEngine.renderer.clearDepth(); // clear depth buffer
    itownsView.mainLoop.gfxEngine.renderer.render(
      topScene,
      itownsView.camera.camera3D
    ); // render scene 2
  };
  return topScene;
}
