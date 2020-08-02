function main() {
  const fs = require("memfs");
  fs.mkdirSync("/a");
  fs.mkdirSync("/a/d");
  fs.writeFileSync("/a/b.js", "require('./c');");
  fs.writeFileSync("/a/c.js", "require('./d/e.js');");
  fs.writeFileSync("/a/d/e.js", "var x = 'foo'; x;");

  const Workspace = require("../lib/Workspace").Workspace;
  const project = new Workspace("/a", { reader: fs });

  project.ls("**/*.js").then(function(files) {
    console.log(files);
  });

  project
    .transform("/a/d/e.js", node => {
      return require("../lib/actions/rename")(node, "x", "y");
    })
    .then(code => {
      console.log(code);
    });
}

main();
