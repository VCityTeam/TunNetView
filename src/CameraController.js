/**
 * @typedef Controls
 * @property {boolean} enabled - Set to false to disable this control.
 */

export class CameraController {
  /**
   *
   * @param {Map<string,Controls>} mapControls
   */
  constructor(mapControls) {
    this.mapControls = mapControls;

    /**@type {Controls} */
    this.currentControls = null;
  }

  disableControls() {
    this.mapControls.forEach((controls) => {
      controls.enabled = false;
    });
  }

  switchControls(controlsMode) {
    this.disableControls();
    this.currentControls = this.mapControls.get(controlsMode);
    this.currentControls.enabled = true;

    if (
      controlsMode == CameraController.CONTROLS.ORBIT_CONTROLS ||
      controlsMode == CameraController.CONTROLS.RAIL_CONTROLS
    ) {
      this.currentControls.update();
    }
  }
}

CameraController.CONTROLS = {
  ORBIT_CONTROLS: 'orbit',
  RAIL_CONTROLS: 'rail',
  FLY_CONTROLS: 'fly',
};
