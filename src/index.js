function main() {
  const fs = require('memfs');
  fs.mkdirSync('/a');
  fs.mkdirSync('/a/d');
  fs.writeFileSync('/a/b.js', 'require("./c");');
  fs.writeFileSync('/a/b.html', '<b>B</b>');
  fs.writeFileSync('/a/c.js', 'require("./d/e.js");');
  fs.writeFileSync('/a/d/e.js', 'var x = "foo"; x;');

  const Workspace = require('../lib/Workspace').Workspace;
  const rename = require('../lib/node/rename');
  const project = new Workspace('/a', { reader: fs });

  project.ls('**/*.js').then(function(files) {
    console.log(files);
  });

  project
    .transform('/a/b.html', node => {
      node.childNodes[0].tagName = 'foo';
      return node;
    })
    .then(code => console.log(code));

  project
    .transform('/a/d/e.js', node => {
      return rename(node, 'x', 'y');
    })
    .then(code => {
      console.log(code);
    });
}

main();
