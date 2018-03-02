// rollup.config.js
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';

export default {
    input: 'src/store.js',
    output: {
        file: 'dist/main.js',
        format: 'cjs'
    },
    plugins: [
        buble(),
        uglify()
    ]
};