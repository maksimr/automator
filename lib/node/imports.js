const visit = require('../Visitor').visit;
const namedTypes = require('../Visitor').types.namedTypes;

module.exports.visitImports = function visitImports(node, visitor) {
  return visit(node, {
    visitImportDeclaration(path) {
      visitor(path.node.source.value, path);
      return false;
    },
    visitCallExpression(path) {
      const node = path.node.callee;
      const importNode = findImportNode(node, path);

      if (namedTypes.MemberExpression.check(node)) {
        if (
          // @ts-ignore
          node.property.name === 'context' &&
          // @ts-ignore
          findImportNode(node.object, path)
        ) {
          extractValueFromCalleAndCallVisitor(path);
        }
      }

      if (importNode) {
        extractValueFromCalleAndCallVisitor(path);
      }

      this.traverse(path);
    }
  });

  function extractValueFromCalleAndCallVisitor(path) {
    if (path.node.arguments.length > 0) {
      visitor(extractValue(path.node.arguments[0]), path);
    }
  }

  function extractValue(node) {
    const argNode = node;
    return namedTypes.ArrayExpression.check(argNode)
      ? argNode.elements.map(extractValue)
      : argNode.value;
  }

  function findImportNode(node, path) {
    let scope = path.scope;
    while ((scope = path.scope && path.scope.lookup(node.name))) {
      path = scope.bindings[node.name][0];
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

    if (node.name === 'require' || namedTypes.Import.check(node)) {
      return node;
    }

    return null;
  }
};

module.exports.updateImportsOnMoveSourceFile = function updateImportsOnMoveSourceFile(
  node,
  sourcePath,
  newSourcePath
) {
  const p = require('path');
  const d = p.dirname;
  return module.exports.visitImports(node, (_, path) => {
    return visit(path.node, {
      visitLiteral(path) {
        const value = path.node.value.toString();
        if (p.isAbsolute(value) || !/^\./.test(value)) {
          return false;
        }

        const newPath = p
          .relative(d(newSourcePath), p.resolve(d(sourcePath), value))
          .replace(/^(?!([.\/]))/, './');
        path.get('value').replace(newPath);
        return false;
      }
    });
  });
};
