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

module.exports = Parser;
