# pika-plugin-build-legacy-browser

> A [@pika/pack](https://github.com/pikapkg/pack) build plugin. Adds an UMD bundle to your package for supporting legacy browsers. Built & optimized to run in all browsers. Useful for hosting on a CDN like UNPKG and/or when package dependencies aren't written to run natively on the web.

## Install

```sh
# npm:
npm install pika-plugin-build-legacy-browser --save-dev
# yarn:
yarn add pika-plugin-build-legacy-browser --dev
```

## Usage

```js
{
  "name": "example-package-json",
  "version": "1.0.0",
  "@pika/pack": {
    "pipeline": [
      ["@pika/plugin-standard-pkg"],
      [
        "pika-plugin-build-legacy-browser",
        {
          "name": "MyBundle" // required
          // other options (optional)
        }
      ]
    ]
  }
}
```

## Options

- `"name"` (Required) Global name for output UMD module.
- `"sourcemap"` (Default: `"true"`): Adds a [source map](https://www.html5rocks.com/en/tutorials/developertools/sourcemaps/) for this build.
- `"namedExports"` (Default: `undefined`): Ecplicitly specify unresolvable named exports (See [`rollup-plugin-commonjs`](https://github.com/rollup/rollup-plugin-commonjs/tree/v9.2.0#custom-named-exports) for more information).
- `"minify"` (Default: `true`): Specify if bundle should be minifed using [`terser`](https://github.com/terser-js/terser) or not. Can also be [`terser` options object](https://github.com/terser-js/terser#minify-options) to further tweak minification.
- `"entrypoint"` (Default: `"umd:main"`): Customize the package.json manifest entrypoint set by this plugin. Accepts either a string, an array of strings, or `null` to disable entrypoint.
  - `{"entrypoint": ["unpkg", "jsdelivr"]}` will create both "unpkg" & "jsdelivr" "dist-umd/index.min.js" entrypoints.

## Result

1. Adds a web bundled distribution to your built package: `dist-umd/index.min.js`
1. Transpiled to run on all browsers
1. All dependencies inlined into this file.
1. Minified using terser (Can optionally be skipped)
1. (if specified) Adds the file to your specified "entrypoint".
