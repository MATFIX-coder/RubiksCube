import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths let the same build work at the site root and on
  // GitHub Pages under /RubiksCube/.
  base: './',
  server: {
    host: true,
  },
});
