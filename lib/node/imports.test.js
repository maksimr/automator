const Parser = require('../Parser');
const visitImports = require('./imports').visitImports;
const updateImportsOnMoveSourceFile = require('./imports')
  .updateImportsOnMoveSourceFile;

describe('imports', function() {
  const parser = new Parser();

  it('should visit imports/requires', function() {
    const imports = [];
    visitImports(parse('require("./b");'), it => imports.push(it));
    expect(imports.pop()).toEqual('./b');

    visitImports(parse('var r = require; r("./b");'), it => imports.push(it));
    expect(imports.pop()).toEqual('./b');

    visitImports(parse('import foo from "./b"'), it => imports.push(it));
    expect(imports.pop()).toEqual('./b');

    visitImports(parse('require.context("./b", true, /.js/);'), it => imports.push(it));
    expect(imports.pop()).toEqual('./b');
  });

  it('should replace relative path for imports', function() {
    const sourcePath = '/a/b/c.js';
    const newSourcePath = '/a/c.js';

    const node = updateImportsOnMoveSourceFile(
      parse('require("./x");require("../x");require("/x");require.context("./", true, /./)'),
      sourcePath,
      newSourcePath
    );
    expect(print(node)).toEqual(
      'require("./b/x");require("./x");require("/x");require.context("./b", true, /./)'
    );
  });

  function print(node) {
    return parser.stringify(node, 'js');
  }

  function parse(content) {
    return parser.parse(content, 'js');
  }
});
