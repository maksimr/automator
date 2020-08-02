function main() {
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
        .then(node => this.parser.stringify(path, node));
    }

    /**
     * @param {string} path
     * @returns {Promise<*>}
     */
    parse(path) {
      const promisify = require("util").promisify;
      return promisify(this.reader.readFile)(path).then(content => {
        const node = this.parser.parse(path, content);
        return node;
      });
    }

    /**
     * @param {string} pattern
     * @returns {Promise<string[]>}
     */
    ls(pattern) {
      const promisify = require("util").promisify;
      const pm = require("picomatch");
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

  const fs = require("memfs");
  fs.mkdirSync("/a");
  fs.mkdirSync("/a/d");
  fs.writeFileSync("/a/b.js", "require('./c');");
  fs.writeFileSync("/a/c.js", "require('./d/e.js');");
  fs.writeFileSync("/a/d/e.js", "var x = 'foo'; x;");

  const w = new Workspace("/a", { reader: fs });
  w.ls("**/*.js").then(function(files) {
    console.log(files);
  });

  w.transform("/a/d/e.js", node => {
    return rename(node, "x", "y");
  }).then(code => {
    console.log(code);
  });

  /**
   * @param {*} node
   * @param {string} varName
   * @param {string} newVarName
   * @param {*=} scope
   * @returns {*}
   */
  function rename(node, varName, newVarName, scope = null) {
    return require("recast").visit(node, {
      visitIdentifier(path) {
        const name = path.node.name;
        if (name === varName && (!scope || path.scope.lookup(name) === scope)) {
          path.get("name").replace(newVarName);
        }
        return false;
      }
    });
  }
}

main();
