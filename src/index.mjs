import nodepath from 'path';
import nodefs from 'fs';
import postcss from 'postcss';
import filetype from 'file-type';

const PLUGIN_NAME = 'deflock-image-inline';
const DEFAULT_PATTERNS = [/(?:img|image)-inline\(\s*['"]?([^"')]+)["']?\s*\)/gi];

/**
 *
 */
export default postcss.plugin(PLUGIN_NAME, (opts = {}) => {
    const options = Object.assign({}, {
        patterns: DEFAULT_PATTERNS,
    }, opts);

    const cache = {};

    /**
     * @param {Object} decl
     * @param {*} matched
     * @param {string} path
     * @returns {string}
     */
    function encode(decl, matched, path) {
        const declfile = decl.source && decl.source.input && decl.source.input.file;
        const fullpath = nodepath.resolve(nodepath.dirname(declfile), path);

        if (!fullpath) {
            throw new Error(`Path ${path} cannot be resolved`);
        }

        if (cache[fullpath]) {
            return cache[fullpath];
        }

        if (!nodefs.existsSync(fullpath)) {
            throw new Error(`File "${fullpath}" does not found`);
        }

        const buffer = Buffer.from(nodefs.readFileSync(fullpath), 'binary');
        const info = filetype(buffer);

        if (!info) {
            throw new Error(`Cannot detect file type of "${fullpath}"`);
        }

        return cache[fullpath] = `data:${info.mime};base64,${buffer.toString('base64')}`;
    }

    return (css) => {
        css.walkDecls(decl => {
            for (const pattern of Array.isArray(options.patterns) ? options.patterns : [options.patterns]) {
                if (pattern.test(decl.value)) {
                    decl.value = decl.value.replace(pattern, (...args) => encode(decl, ...args));
                }
            }
        });
    };
});
