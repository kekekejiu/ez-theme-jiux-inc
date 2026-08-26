import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import fs from 'node:fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const generateRandomFileName = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let name = '';
  for (let i = 0; i < length; i += 1) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${randomNumber}.${name}.js`;
};

// 对业务 chunk 做字符串数组混淆，隐藏 passport/auth、guest/comm、面板类型等特征字面量。
// 仅处理应用代码，跳过体积大且无特征的第三方与语言包 chunk，兼顾性能与包体。
const OBFUSCATE_SKIP = new Set([
  'vendor', 'charts', 'editor-markdown', 'qrcode', 'crypto', 'icons', 'feature-widgets'
]);
const LOCALE_RE = /^(zh-CN|zh-TW|en-US|ja-JP|ko-KR|ru-RU|fa-IR|vi-VN)-/;

const createChunkObfuscationPlugin = () => ({
  name: 'ez-chunk-obfuscation',
  enforce: 'post',
  renderChunk(code, chunk) {
    const name = chunk.name || '';
    const file = chunk.fileName || '';
    if (OBFUSCATE_SKIP.has(name)) return null;
    if (LOCALE_RE.test(file.replace(/^static\//, ''))) return null;
    try {
      const result = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        identifierNamesGenerator: 'mangled',
        simplify: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 1,
        // 关闭 splitStrings：它会拆分并重新拼接字符串，曾导致 rollup 动态 import
        // 的 chunk 文件名(如 appInit-xxxx.js)被破坏成乱码 → 404 白屏。
        splitStrings: false,
        // 保护所有含 .js / 资源路径的字符串不被移入 stringArray，
        // 确保动态 import 的 chunk 文件名保持原样。
        reservedStrings: ['\\.js', '\\.css', '\\.png', '\\.woff', 'static/', 'assets/'],
        unicodeEscapeSequence: false,
        sourceMap: false
      });
      return { code: result.getObfuscatedCode(), map: null };
    } catch (err) {
      this.warn(`chunk 混淆失败(${file}): ${err.message}`);
      return null;
    }
  }
});

const createRuntimeConfigPlugin = ({ enableConfigJS, enableObfuscation, extraScriptFileName }) => ({
  name: 'ez-runtime-config',
  transformIndexHtml(html) {
    if (!enableConfigJS) {
      return html.replace('<!--EZ_CONFIG_SCRIPT-->', '');
    }

    return html.replace('<!--EZ_CONFIG_SCRIPT-->', `<script src="./${extraScriptFileName}"></script>`);
  },
  closeBundle() {
    if (!enableConfigJS) return;

    const configPath = path.resolve(__dirname, 'src/config/index.js');
    const distPath = path.resolve(__dirname, 'dist', extraScriptFileName);

    try {
      let content = fs.readFileSync(configPath, 'utf-8');
      content = content.replace(/window\.EZ_CONFIG\s*=\s*config\s*;?/g, '');
      content = content.replace(/export\s+const\s+config\s*=/, 'window.EZ_CONFIG =');

      if (enableObfuscation) {
        content = JavaScriptObfuscator.obfuscate(content, {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          numbersToExpressions: true,
          simplify: true,
          stringArray: true,
          stringArrayEncoding: ['rc4'],
          stringArrayThreshold: 0.75,
          transformObjectKeys: true,
          unicodeEscapeSequence: true
        }).getObfuscatedCode();
      }

      fs.writeFileSync(distPath, content, 'utf-8');
      console.log(`生成獨立設定檔: ${extraScriptFileName}`);
    } catch (err) {
      console.warn('生成獨立設定檔失敗:', err);
    }
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  const enableConfigJS = isProd && env.VUE_APP_CONFIGJS === 'true';
  const enableObfuscation = env.VUE_APP_OBFUSCATION === 'true';
  const extraScriptFileName = enableConfigJS ? generateRandomFileName() : '';

  return {
    base: './',
    plugins: [
      vue(),
      createRuntimeConfigPlugin({
        enableConfigJS,
        enableObfuscation,
        extraScriptFileName
      }),
      ...(isProd ? [createChunkObfuscationPlugin()] : [])
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
      'process.env': {
        NODE_ENV: mode,
        VUE_APP_TITLE: env.VUE_APP_TITLE,
        VUE_APP_ENV: env.VUE_APP_ENV,
        VUE_APP_DEBUGGING: env.VUE_APP_DEBUGGING,
        VUE_APP_CONFIGJS: env.VUE_APP_CONFIGJS,
        VUE_APP_OBFUSCATION: env.VUE_APP_OBFUSCATION
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/styles/base/variables.scss" as *;'
        }
      }
    },
    optimizeDeps: {
      include: ['axios', 'vue', 'vue-router', 'pinia', 'vue-i18n']
    },
    build: {
      outDir: 'dist',
      assetsDir: 'static',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: true
        },
        mangle: true,
        format: {
          comments: false,
          ascii_only: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            // 這些依賴只在特定頁面使用，拆包可降低首屏主包壓力。
            if (id.includes('echarts') || id.includes('chart.js')) return 'charts';
            if (id.includes('aieditor') || id.includes('markdown-it') || id.includes('marked')) return 'editor-markdown';
            if (id.includes('qrcode') || id.includes('qrcode.vue') || id.includes('vue3-qrcode')) return 'qrcode';
            if (id.includes('crisp') || id.includes('shepherd') || id.includes('confetti')) return 'feature-widgets';
            if (id.includes('@tabler/icons-vue')) return 'icons';
            if (id.includes('crypto-js') || id.includes('jsencrypt') || id.includes('@originjs/crypto-js-wasm')) return 'crypto';
            return 'vendor';
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173
    },
    test: {
      setupFiles: ['tests/setup/localStorage.js']
    }
  };
});
