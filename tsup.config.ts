import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  format: ['cjs'],
  shims: false,
  dts: false,
  sourcemap: true,
  target: 'node18',
  external: [
    'vscode',
  ],
})
