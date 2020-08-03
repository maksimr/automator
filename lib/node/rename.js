/**
 * @param {*} node
 * @param {string} varName
 * @param {string} newVarName
 * @param {*=} scope
 * @returns {*}
 */
module.exports = function rename(node, varName, newVarName, scope = null) {
  return require('recast').visit(node, {
    visitIdentifier(path) {
      const name = path.node.name;
      if (name === varName && (!scope || path.scope.lookup(name) === scope)) {
        path.get('name').replace(newVarName);
      }
      return false;
    }
  });
};
