class JsParser {
  constructor() {
    this.recast = require("recast");
  }

  parse(code, options) {
    return this.recast.parse(code, options);
  }

  print(node, options = { quote: "single" }) {
    return this.recast.print(node, options).code;
  }
}

class Parser {
  constructor() {
    this.parsers = {};
    this.register(".js", new JsParser());
  }

  /**
   * @param {string} extname
   * @param {*} parser
   */
  register(extname, parser) {
    this.parsers[extname] = parser;
    return parser;
  }

  /**
   * @param {string} content
   * @param {string} path
   */
  parse(content, path) {
    const node = this.pathToParser(path).parse(content, {
      sourceFileName: path
    });
    return node;
  }

  /**
   * @param {*} node
   * @param {string} path
   * @returns {string} code
   */
  stringify(node, path) {
    return this.pathToParser(path).print(node);
  }

  /**
   * @param {string} path
   * @returns {*} parser
   */
  pathToParser(path) {
    const ext = require("path").extname(path);
    const parser = this.parsers[ext];
    if (!parser) {
      throw new Error("Unsupported file type '" + ext + "'");
    }
    return parser;
  }
}

module.exports = Parser;
