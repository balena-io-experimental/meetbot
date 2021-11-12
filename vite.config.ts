import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import macrosPlugin from 'vite-plugin-babel-macros';

// https://vitejs.dev/config/
export default defineConfig({
	root: 'src/ui/',
	build: {
		outDir: '../../build/www',
	},
	plugins: [react(), svgr(), macrosPlugin()],
});
