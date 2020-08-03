const promisify = require('util').promisify;
const pm = require('picomatch');
const Parser = require('./Parser');

class Workspace {
  /**
   * @param {string} dir
   * @param {*} options
   */
  constructor(dir, options = {}) {
    this.dir = dir;
    this.reader = options.reader;
    this.parser = new Parser();
  }

  /**
   * @param {string} path
   * @param {function(*):*} transformer
   * @returns {Promise<string>}
   */
  transform(path, transformer) {
    return this.parse(path)
      .then(node => transformer(node))
      .then(node =>
        this.write(path, this.parser.stringify(node, pathToType(path)))
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
   * @returns {Promise<string>} conent
   */
  write(path, content) {
    return promisify(this.reader.writeFile)(path, content).then(() => content);
  }

  /**
   * @param {string} path
   * @returns {Promise<*>}
   */
  parse(path) {
    return this.read(path).then(content => {
      return this.parser.parse(content, pathToType(path));
    });
  }

  /**
   * @param {string} pattern
   * @returns {Promise<string[]>}
   */
  ls(pattern) {
    const isMatch = pm(pattern);
    const reader = this.reader;

    return readdir(this.dir).then(files => {
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
          } else if (isMatch(path)) {
            result.push(path);
          }
        }

        return Promise.all(result).then(data => {
          return data.flat();
        });
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
