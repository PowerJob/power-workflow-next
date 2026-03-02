/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';

  return {
    plugins: [react()],
    root: isLib ? undefined : path.resolve(__dirname, 'playground'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      include: ['tests/unit/**/*.test.{ts,tsx}'],
      root: '.',
    },
    ...(isLib && {
      root: undefined,
      build: {
        lib: {
          entry: path.resolve(__dirname, 'src/index.ts'),
          name: 'PowerWorkflowNext',
          formats: ['es', 'cjs'],
          fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
          cssFileName: 'style',
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime', '@xyflow/react'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              '@xyflow/react': 'ReactFlow',
            },
          },
        },
        sourcemap: true,
        minify: false,
      },
    }),
  };
});
