import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({
  resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
  plugins:[{name:'fiber-timer',enforce:'pre',resolveId(source,importer){if(source==='three'&&importer&&/[/\\]@react-three[/\\]fiber[/\\]/.test(importer))return fileURLToPath(new URL('./lib/three-for-fiber.mjs',import.meta.url));}}],
  // Prebundle Fiber and its CommonJS selector shim. Leaving Fiber excluded
  // makes Vite serve use-sync-external-store's CJS file as raw ESM, which
  // causes `traditional.mjs` to fail with a missing default export in dev.
  optimizeDeps:{force:true,include:['@react-three/fiber','@react-three/drei','zustand/traditional','use-sync-external-store/shim/with-selector']},
  server:{host:'127.0.0.1',port:5173,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:8787',changeOrigin:false}}},
  build:{outDir:'dist',chunkSizeWarningLimit:1800}
});
