function main() {
  class Parser {
    parse(path, content) {
      const node = this.pathToParser(path).parse(content);
      node.path = path;
      return node;
    }

    stringify(path, node) {
      return this.pathToParser(path).print(node).code;
    }

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
    constructor(dir, options = {}) {
      this.dir = dir;
      this.reader = options.reader;
      this.parser = new Parser();
    }

    transform(path, transformer) {
      return this.parse(path)
        .then(node => transformer(node))
        .then(node => this.parser.stringify(path, node));
    }

    parse(path) {
      const promisify = require("util").promisify;
      return promisify(this.reader.readFile)(path).then(content => {
        const node = this.parser.parse(path, content);
        return node;
      });
    }

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
  fs.writeFileSync("/a/d/e.js", "var x = 'foo'");

  const w = new Workspace("/a", { reader: fs });
  w.ls("**/*.js").then(function(files) {
    w.transform(files[0], node => node).then(console.log);
  });
}

main();
