// Only Fiber's internal Three import is redirected here by vite.config.ts.
// All scene constructors retain their original Three identity.
export * from 'three';
export { FiberTimer as Clock } from './fiber-timer.mjs';
