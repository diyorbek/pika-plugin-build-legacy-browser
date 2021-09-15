import rollupCommonJs from '@rollup/plugin-commonjs';
import rollupJson from '@rollup/plugin-json';
import rollupNodeResolve from '@rollup/plugin-node-resolve';
import { terser as rollupTerser } from 'rollup-plugin-terser';
import rollupBabel from '@rollup/plugin-babel';
import babelPluginDynamicImportSyntax from '@babel/plugin-syntax-dynamic-import';
import babelPluginImportMetaSyntax from '@babel/plugin-syntax-import-meta';
import babelPresetEnv from '@babel/preset-env';
import path from 'path';
import fs from 'fs';
import { MessageError } from '@pika/types';
import { rollup } from 'rollup';
const DEFAULT_ENTRYPOINT = 'umd:main';
export async function beforeJob({ out, options }) {
    if (!options.name) {
        throw new MessageError('Missing name for `iife` bundle.');
    }
    const srcDirectory = path.join(out, 'dist-src/');
    if (!fs.existsSync(srcDirectory)) {
        throw new MessageError('"dist-src/" does not exist, or was not yet created in the pipeline.');
    }
    const srcEntrypoint = path.join(out, 'dist-src/index.js');
    if (!fs.existsSync(srcEntrypoint)) {
        throw new MessageError('"dist-src/index.js" is the expected standard entrypoint, but it does not exist.');
    }
}
export function manifest(manifest, { options }) {
    if (options.entrypoint !== null) {
        let keys = options.entrypoint || [DEFAULT_ENTRYPOINT];
        if (typeof keys === 'string') {
            keys = [keys];
        }
        for (const key of keys) {
            manifest[key] = manifest[key] || 'dist-umd/index.min.js';
        }
    }
}
export async function build({ out, options, reporter, }) {
    const iifeBundleName = options.name;
    const writeToUmd = path.join(out, 'dist-umd');
    const writeToUmdMin = path.join(writeToUmd, 'index.min.js');
    const result = await rollup({
        input: path.join(out, 'dist-src/index.js'),
        plugins: [
            rollupNodeResolve({
                preferBuiltins: true,
                browser: !!options.browser,
            }),
            rollupCommonJs({
                include: 'node_modules/**',
                sourceMap: false,
                namedExports: options.namedExports,
            }),
            rollupJson({
                include: 'node_modules/**',
                compact: true,
            }),
            rollupBabel({
                babelrc: false,
                compact: false,
                presets: [
                    [
                        babelPresetEnv,
                        {
                            modules: false,
                            spec: true,
                            targets: {
                                // Recommended in: https://jamie.build/last-2-versions
                                browsers: ['>0.25%', 'not op_mini all'],
                            },
                        },
                    ],
                ],
                plugins: [babelPluginDynamicImportSyntax, babelPluginImportMetaSyntax],
            }),
            options.minify !== false
                ? rollupTerser(typeof options.minify === 'object' ? options.minify : undefined)
                : {},
        ],
        onwarn: ((warning, defaultOnWarnHandler) => {
            // // Unresolved external imports are expected
            if (warning.code === 'UNRESOLVED_IMPORT' &&
                !(warning.source.startsWith('./') || warning.source.startsWith('../'))) {
                return;
            }
            defaultOnWarnHandler(warning);
        }),
    });
    await result.write({
        dir: writeToUmd,
        entryFileNames: '[name].min.js',
        chunkFileNames: '[name]-[hash].min.js',
        format: 'iife',
        name: iifeBundleName,
        exports: 'named',
        sourcemap: options.sourcemap === undefined ? true : options.sourcemap,
    });
    reporter.created(writeToUmdMin);
}
