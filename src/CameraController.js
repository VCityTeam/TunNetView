/**
 * @typedef Controls
 * @property {boolean} enabled - Set to false to disable this control.
 * @property {function(): void}  update - .
 */

export class CameraController {
  /**
   *
   * @param {Map<string,Controls>} mapControls
   */
  constructor(mapControls) {
    this.mapControls = mapControls;

    /**@type{Controls} */
    this.currentControls = null;

    console.log(mapControls);
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
    this.currentControls.update();
  }
}

CameraController.CONTROLS = {
  ORBIT_CONTROLS: 'orbit_control',
  RAIL_CONTROLS: 'rail_controls',
};
