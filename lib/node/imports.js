module.exports.visitImports = function visitImports(node, visitor) {
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
};
