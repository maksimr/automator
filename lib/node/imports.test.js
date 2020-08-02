const Parser = require("../Parser");
const visitImports = require("./imports").visitImports;

describe("imports", function() {
  const parser = new Parser();

  it("should visit imports/requires", function() {
    const imports = [];
    visitImports(parse("require('./b');"), it => imports.push(it));
    expect(imports.pop()).toEqual("./b");

    visitImports(parse("var r = require; r('./b');"), it => imports.push(it));
    expect(imports.pop()).toEqual("./b");

    visitImports(parse("import foo from './b'"), it => imports.push(it));
    expect(imports.pop()).toEqual("./b");
  });

  function parse(content) {
    return parser.parse("./a.js", content);
  }
});
