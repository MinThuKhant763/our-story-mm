import { Timer } from 'three';

// Fiber 9 expects the Clock API. Keep its seconds/start/stop/manual-frame
// contract while delegating time measurement to the supported Three Timer.
// No visibility listeners: Fiber 9 never disposes its clock on unmount.
export class FiberTimer {
  autoStart;
  startTime = 0;
  oldTime = 0;
  elapsedTime = 0;
  running = false;
  #timer = new Timer();

  constructor(autoStart = true) { this.autoStart = autoStart; }

  start() {
    this.startTime = performance.now();
    this.oldTime = this.startTime;
    this.elapsedTime = 0;
    this.#timer.reset();
    this.running = true;
  }

  stop() {
    this.getElapsedTime();
    this.running = false;
    this.autoStart = false;
  }

  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }

  getDelta() {
    if (this.autoStart && !this.running) { this.start(); return 0; }
    if (!this.running) return 0;
    this.oldTime = performance.now();
    this.#timer.update(this.oldTime);
    const delta = this.#timer.getDelta();
    this.elapsedTime += delta;
    return delta;
  }
}
