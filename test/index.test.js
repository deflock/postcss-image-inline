'use strict';

const postcss = require('postcss');
const plugin = require('..').default;

process.chdir(__dirname);

/**
 * @param {string} input
 * @param {string} expected
 * @param {Object} pluginOptions
 * @param {Object} postcssOptions
 * @param {Array} warnings
 * @returns {Promise}
 */
function run(input, expected, pluginOptions = {}, postcssOptions = {}, warnings = []) {
    return postcss([plugin(pluginOptions)])
        .process(input, Object.assign({from: 'input.css'}, postcssOptions))
        .then((result) => {
            const resultWarnings = result.warnings();
            resultWarnings.forEach((warning, index) => {
                expect(warnings[index]).toEqual(warning.text);
            });
            expect(resultWarnings.length).toEqual(warnings.length);
            expect(result.css).toEqual(expected);
            return result;
        });
}

it('shoud work', () => {
    run(
        'a { background: url(img-inline(fixtures/gif.gif)) 50% 50% no-repeat }',
        'a { background: url(data:image/gif;base64,R0lGODlhAQABAAAAADs=) 50% 50% no-repeat }'
    );
    run(
        'a { background: url(image-inline(fixtures/png.png)) }',
        'a { background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQAB) }'
    );
});
