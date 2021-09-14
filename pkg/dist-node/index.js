'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rollupCommonJs = _interopDefault(require('@rollup/plugin-commonjs'));
var rollupJson = _interopDefault(require('@rollup/plugin-json'));
var rollupNodeResolve = _interopDefault(require('@rollup/plugin-node-resolve'));
var rollupPluginTerser = require('rollup-plugin-terser');
var rollupBabel = _interopDefault(require('@rollup/plugin-babel'));
var babelPluginDynamicImportSyntax = _interopDefault(require('@babel/plugin-syntax-dynamic-import'));
var babelPluginImportMetaSyntax = _interopDefault(require('@babel/plugin-syntax-import-meta'));
var babelPresetEnv = _interopDefault(require('@babel/preset-env'));
var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));
var types = require('@pika/types');
var rollup = require('rollup');

const DEFAULT_ENTRYPOINT = 'browser';
async function beforeJob({
  out,
  options
}) {
  if (!options.name) {
    throw new types.MessageError('Missing name for `iife` bundle.');
  }

  const srcDirectory = path.join(out, 'dist-src/');

  if (!fs.existsSync(srcDirectory)) {
    throw new types.MessageError('"dist-src/" does not exist, or was not yet created in the pipeline.');
  }

  const srcEntrypoint = path.join(out, 'dist-src/index.js');

  if (!fs.existsSync(srcEntrypoint)) {
    throw new types.MessageError('"dist-src/index.js" is the expected standard entrypoint, but it does not exist.');
  }
}
function manifest(manifest, {
  options
}) {
  if (options.entrypoint !== null) {
    let keys = options.entrypoint || [DEFAULT_ENTRYPOINT];

    if (typeof keys === 'string') {
      keys = [keys];
    }

    for (const key of keys) {
      manifest[key] = manifest[key] || 'dist-browser/index.min.js';
    }
  }
}
async function build({
  out,
  options,
  reporter
}) {
  const iifeBundleName = options.name;
  const writeToBrowser = path.join(out, 'dist-browser');
  const writeToBrowserMin = path.join(writeToBrowser, 'index.min.js');
  const result = await rollup.rollup({
    input: path.join(out, 'dist-src/index.js'),
    plugins: [rollupNodeResolve({
      preferBuiltins: true,
      browser: !!options.browser
    }), rollupCommonJs({
      include: 'node_modules/**',
      sourceMap: false,
      namedExports: options.namedExports
    }), rollupJson({
      include: 'node_modules/**',
      compact: true
    }), rollupBabel({
      babelrc: false,
      compact: false,
      presets: [[babelPresetEnv, {
        modules: false,
        spec: true,
        targets: {
          // Recommended in: https://jamie.build/last-2-versions
          browsers: ['>0.25%', 'not op_mini all']
        }
      }]],
      plugins: [babelPluginDynamicImportSyntax, babelPluginImportMetaSyntax]
    }), options.minify !== false ? rollupPluginTerser.terser(typeof options.minify === 'object' ? options.minify : undefined) : {}],
    onwarn: (warning, defaultOnWarnHandler) => {
      // // Unresolved external imports are expected
      if (warning.code === 'UNRESOLVED_IMPORT' && !(warning.source.startsWith('./') || warning.source.startsWith('../'))) {
        return;
      }

      defaultOnWarnHandler(warning);
    }
  });
  await result.write({
    dir: writeToBrowser,
    entryFileNames: '[name].min.js',
    chunkFileNames: '[name]-[hash].min.js',
    format: 'iife',
    name: iifeBundleName,
    exports: 'named',
    sourcemap: options.sourcemap === undefined ? true : options.sourcemap
  });
  reporter.created(writeToBrowserMin);
}

exports.beforeJob = beforeJob;
exports.build = build;
exports.manifest = manifest;
//# sourceMappingURL=index.js.map
