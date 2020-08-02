const promisify = require("util").promisify;
const pm = require("picomatch");

class Parser {
  /**
   * @param {string} path
   * @param {string} content
   */
  parse(path, content) {
    const node = this.pathToParser(path).parse(content);
    node.path = path;
    return node;
  }

  /**
   * @param {string} path
   * @param {*} node
   * @returns {string} code
   */
  stringify(path, node) {
    return this.pathToParser(path).print(node).code;
  }

  /**
   * @param {string} path
   * @returns {*} parser
   */
  pathToParser(path) {
    const ext = require("path").extname(path);
    switch (ext) {
      case ".js":
        return require("recast");
      default:
        throw new Error("Unsupported file type '" + ext + "'");
    }
  }
}

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
      .then(node => this.write(path, this.parser.stringify(path, node)));
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
      return this.parser.parse(path, content);
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
          const path = dir + "/" + it.name;
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

module.exports.Workspace = Workspace;
