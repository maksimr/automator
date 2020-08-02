function main() {
  const Workspace = require("../lib/Workspace").Workspace;
  const fs = require("memfs");
  fs.mkdirSync("/a");
  fs.mkdirSync("/a/d");
  fs.writeFileSync("/a/b.js", "require('./c');");
  fs.writeFileSync("/a/c.js", "require('./d/e.js');");
  fs.writeFileSync("/a/d/e.js", "var x = 'foo'; x;");

  const w = new Workspace("/a", { reader: fs });
  w.ls("**/*.js").then(function(files) {
    console.log(files);
  });

  w.transform("/a/d/e.js", node => {
    return rename(node, "x", "y");
  }).then(code => {
    console.log(code);
  });

  /**
   * @param {*} node
   * @param {string} varName
   * @param {string} newVarName
   * @param {*=} scope
   * @returns {*}
   */
  function rename(node, varName, newVarName, scope = null) {
    return require("recast").visit(node, {
      visitIdentifier(path) {
        const name = path.node.name;
        if (name === varName && (!scope || path.scope.lookup(name) === scope)) {
          path.get("name").replace(newVarName);
        }
        return false;
      }
    });
  }
}

main();
