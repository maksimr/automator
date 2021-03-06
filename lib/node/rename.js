const visit = require('../Visitor').visit;

/**
 * @typedef {*} ASTNode
 */
/**
 * @param {ASTNode} node
 * @param {string} varName
 * @param {string} newVarName
 * @param {*=} scope
 * @returns {ASTNode}
 */
module.exports = function rename(node, varName, newVarName, scope = null) {
  return visit(node, {
    visitIdentifier(path) {
      const name = path.node.name;
      if (name === varName && (!scope || path.scope.lookup(name) === scope)) {
        path.get('name').replace(newVarName);
      }
      return false;
    }
  });
};
