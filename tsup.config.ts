import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  external: ['vscode'],
  clean: true,
  shims: false,
  dts: false,
  sourcemap: true,
})
