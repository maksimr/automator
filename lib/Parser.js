class JsParser {
  constructor() {
    this.recast = require('recast');
  }

  parse(code, options) {
    return this.recast.parse(code, options);
  }

  print(node, options = { quote: 'double' }) {
    return this.recast.print(node, options).code;
  }
}

class Parser {
  constructor() {
    this.parsers = {};
    this.register('js', new JsParser());
  }

  /**
   * @param {string} type
   * @param {*} parser
   */
  register(type, parser) {
    this.parsers[type] = parser;
    return parser;
  }

  /**
   * @param {string} content
   * @param {string} type
   */
  parse(content, type) {
    return this.typeToParser(type).parse(content);
  }

  /**
   * @param {*} node
   * @param {string} type
   * @returns {string} code
   */
  stringify(node, type) {
    return this.typeToParser(type).print(node);
  }

  /**
   * @param {string} type
   * @returns {*} parser
   */
  typeToParser(type) {
    const parser = this.parsers[type];
    if (!parser) {
      throw new Error('Unsupported file type "' + type + '"');
    }
    return parser;
  }
}

module.exports = Parser;
