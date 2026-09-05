import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Using a relative base ('./') means the built app works correctly no matter
// which repository name / subpath it's served from on GitHub Pages, without
// needing to hardcode "/your-repo-name/" here. Combined with HashRouter
// (see src/main.tsx) this also avoids the classic GitHub Pages 404-on-refresh
// problem for a client-side-routed single page app.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
