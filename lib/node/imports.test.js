const Parser = require("../Parser");

function visitImports(node, visitor) {
  const namedTypes = require("recast").types.namedTypes;
  return require("recast").visit(node, {
    visitImportDeclaration(path) {
      visitor(path.node.source.value, path);
      return false;
    },
    visitCallExpression(currentPath) {
      let path = currentPath;
      let node = path.node.callee;
      let scope = path.scope;
      while ((scope = path.scope.lookup(node.name))) {
        const path = scope.bindings[node.name][0];
        node = path.value;
        if (
          namedTypes.Identifier.check(node) &&
          namedTypes.VariableDeclarator.check(path.parentPath.value)
        ) {
          node = path.parentPath.value;
          if (namedTypes.Identifier.check(node.init)) {
            node = node.init;
            continue;
          }
        }
        break;
      }

      if (node.name === "require" || namedTypes.Import.check(node)) {
        if (path.node.arguments.length > 0) {
          visitor(path.node.arguments[0].value, path);
        }
      }

      this.traverse(currentPath);
    }
  });
}

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
