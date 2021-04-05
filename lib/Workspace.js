const promisify = require('util').promisify;
const pm = require('picomatch');
const Parser = require('./Parser');

/**
 * @typedef {*} ASTNode
 */

class Workspace {
  /**
   * @param {string} rootDir
   * @param {{reader:*}} options
   */
  constructor(rootDir, options = { reader: null }) {
    this.rootDir = rootDir;
    this.reader = options.reader;
    this.parser = new Parser();
  }

  /**
   * @typedef TransformOptions
   * @property {*} [parseOptions]
   * @property {*} [printOptions]
   */
  /**
   * @param {string} path
   * @param {function(ASTNode):(ASTNode|null|undefined)} transformer
   * @param {TransformOptions} [options]
   * @returns {Promise<string|null>} content
   */
  transform(path, transformer, options) {
    const parseOptions = options && options.parseOptions;
    const printOptions = options && options.printOptions;
    return this.parse(path, parseOptions)
      .then(node => transformer(node))
      .then(node =>
        node ? this.write(path, this.parser.print(node, pathToType(path), printOptions)) : null
      );
  }

  /**
   * @param {string} path
   * @returns {Promise<string>} content
   */
  read(path) {
    return promisify(this.reader.readFile)(path);
  }

  /**
   * @param {string} path
   * @param {string} content
   * @returns {Promise<string>} content
   */
  write(path, content) {
    return promisify(this.reader.writeFile)(path, content).then(() => content);
  }

  /**
   * @param {string} path
   * @param {object} [options]
   * @returns {Promise<ASTNode>} node
   */
  parse(path, options) {
    return this.read(path).then(content => {
      return this.parser.parse(content.toString(), pathToType(path), options);
    });
  }

  /**
   * @param {string} pattern
   * @returns {Promise<string[]>}
   */
  ls(pattern) {
    const glob = require('path').resolve(this.rootDir, pattern);
    const isMatch = pm(glob);
    const reader = this.reader;

    return readdir(this.rootDir).then(files => {
      return files;
    });

    function readdir(dir) {
      return promisify(reader.readdir)(dir, {
        withFileTypes: true
      }).then(files => {
        const result = [];
        for (let i = 0; i < files.length; i++) {
          const it = files[i];
          const path = dir + '/' + it.name;
          if (it.isDirectory()) {
            result.push(readdir(path));
          }
          if (isMatch(path)) {
            result.push(path);
          }
        }

        return Promise.all(result).then(data => data.flat(Infinity));
      });
    }
  }
}

function pathToType(path) {
  return require('path')
    .extname(path)
    .replace(/^\./, '');
}

module.exports.Workspace = Workspace;