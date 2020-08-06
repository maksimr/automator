const Parser = require('../Parser');
const visitImports = require('./imports').visitImports;
const updateImportsOnMoveSourceFile = require('./imports')
  .updateImportsOnMoveSourceFile;

describe('imports', function() {
  const parser = new Parser();

  describe('visitImports', function() {
    it('should visit requires', function() {
      const imports = [];
      visitImports(parse('require("./a")'), it => imports.push(it));
      expect(imports).toEqual(['./a']);
    });

    it('should visit require even if it used indirectly', function() {
      const imports = [];
      visitImports(parse('var r = require; r("./a")'), it => imports.push(it));
      expect(imports).toEqual(['./a']);
    });

    it('should visit imports', function() {
      const imports = [];
      visitImports(parse('import foo from "./a";'), it => imports.push(it));
      expect(imports).toEqual(['./a']);
    });

    it('should visit require context', function() {
      const imports = [];
      visitImports(parse('require.context("./a", true, /.js/);'), it =>
        imports.push(it)
      );
      expect(imports).toEqual(['./a']);
    });

    it('should visit async require', function() {
      const imports = [];
      visitImports(parse('require(["./a", "./b"], () => null)'), it =>
        imports.push(it)
      );
      expect(imports.pop()).toEqual(['./a', './b']);
    });

    it('should visit require in root node without scope', function() {
      const node = parse('[require("./a"), require("./b")]');
      const arrayNode = node.program.body[0].expression;
      const imports = [];
      visitImports(arrayNode, it => imports.push(it));
      expect(imports).toEqual(['./a', './b']);
    });
  });

  describe('updateImportsOnMoveSourceFile', function() {
    it('should replace relative path for imports', function() {
      const sourcePath = '/a/b/c.js';
      const newSourcePath = '/a/c.js';

      const node = updateImportsOnMoveSourceFile(
        parse(
          'require("./x");require("../x");require("/x");require.context("./", true, /./)'
        ),
        sourcePath,
        newSourcePath
      );
      expect(print(node)).toEqual(
        'require("./b/x");require("./x");require("/x");require.context("./b", true, /./)'
      );
    });
  });

  function print(node) {
    return parser.stringify(node, 'js');
  }

  function parse(content) {
    return parser.parse(content, 'js');
  }
});
