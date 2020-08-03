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

  function updateImportsOnMoveSourceFile(node, filePath, newFilePath) {
    const p = require("path");
    const d = p.dirname;
    return visitImports(node, (_, path) => {
      return require("recast").visit(path.node, {
        visitLiteral(path) {
          const value = path.node.value;
          if (p.isAbsolute(value) || !/^\./.test(value)) {
            return false;
          }

          const newPath = p
            .relative(d(newFilePath), p.resolve(d(filePath), value))
            .replace(/^(?!(\.|\/))/, "./");
          path.get("value").replace(newPath);
          return false;
        }
      });
    });
  }

  it("should replace relative path for imports", function() {
    const filePath = "/a/b/c.js";
    const newFilePath = "/a/c.js";

    const node = updateImportsOnMoveSourceFile(
      parse("require('./x');require('../x');require('/x')"),
      filePath,
      newFilePath
    );
    expect(print(node)).toEqual(
      "require('./b/x');require('./x');require('/x')"
    );
  });

  function print(node) {
    return parser.stringify("./a.js", node);
  }

  function parse(content) {
    return parser.parse("./a.js", content);
  }
});
