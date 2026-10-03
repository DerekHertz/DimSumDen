// Pointer lock fixes the mouse at its old UI position; first-person picking must use the crosshair.
export function denEvents(base,stage) {
  return {...base,compute(event,state,previous){
    if(stage.explorer?.active && document.pointerLockElement===state.gl.domElement){
      state.pointer.set(0,0);state.raycaster.setFromCamera(state.pointer,state.camera);
    }else base.compute(event,state,previous);
  }};
}
