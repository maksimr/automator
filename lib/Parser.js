/**
 * @typedef {*} ASTNode
 */

/**
 * @interface
 */
class IParser {
  /**
   * @param {string} code
   * @param {*} options
   */
  // eslint-disable-next-line no-unused-vars
  parse(code, options) {}

  /**
   * @param {ASTNode} node
   * @param {*} options
   * @returns {string}
   */
  // eslint-disable-next-line no-unused-vars
  print(node, options) {
    return '';
  }
}

class CssParser extends IParser {
  constructor() {
    super();
    this.css = require('css');
  }

  parse(code, options) {
    return this.css.parse(code, options);
  }

  print(node, options) {
    return this.css.stringify(node, options);
  }
}

class JsParser extends IParser {
  constructor() {
    super();
    this.recast = require('recast');
  }

  parse(code, options) {
    return this.recast.parse(code, options);
  }

  print(node, options = {quote: 'double'}) {
    // @ts-ignore
    return this.recast.print(node, options).code;
  }
}

class HtmlParser extends IParser {
  constructor() {
    super();
    this.parse5 = require('parse5');
  }

  parse(code, options) {
    return this.parse5.parseFragment(code, options);
  }

  print(node, options) {
    return this.parse5.serialize(node, options);
  }
}

class Parser {
  constructor() {
    this.parsers = {};
    this.register('js', new JsParser());
    this.register('html', new HtmlParser());
    this.register('css', new CssParser());
  }

  /**
   * @param {string} type
   * @param {IParser} parser
   * @returns {IParser} parser
   */
  register(type, parser) {
    this.parsers[type] = parser;
    return parser;
  }

  /**
   * @param {string} content
   * @param {string} type
   * @param {object} [options]
   * @returns {ASTNode} node
   */
  parse(content, type, options) {
    return this.typeToParser(type).parse(content, options);
  }

  /**
   * @param {ASTNode} node
   * @param {string} type
   * @returns {string} code
   */
  stringify(node, type) {
    return this.typeToParser(type).print(node);
  }

  /**
   * @param {string} type
   * @returns {IParser} parser
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
module.exports.IParser = IParser;
