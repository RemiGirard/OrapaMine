import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    copyPublicDir: false,
    cssCodeSplit: false,
    emptyOutDir: true,
    outDir: 'dist-single',
    rollupOptions: {
      input: 'standalone.html',
    },
    target: 'es2022',
  },
  plugins: [viteReact(), viteSingleFile(), renameStandaloneHtml()],
  resolve: { tsconfigPaths: true },
})

function renameStandaloneHtml(): Plugin {
  return {
    enforce: 'post',
    generateBundle(_, bundle) {
      const entry = Object.values(bundle).find(
        (output) => output.fileName === 'standalone.html',
      )

      if (!entry || entry.type !== 'asset') {
        throw new Error('Single-file build did not emit standalone.html')
      }

      entry.fileName = 'orapa-mine.html'
    },
    name: 'rename-standalone-html',
  }
}
