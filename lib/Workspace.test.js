global.Error = Error;
global.TypeError = TypeError;
global.RangeError = RangeError;

const fs = require('memfs');
const Workspace = require('./Workspace').Workspace;
const rename = require('./node/rename');

describe('Workspace', function() {
  const w = new Workspace('/a', { reader: fs });

  beforeEach(function() {
    fs.mkdirSync('/a');
    fs.writeFileSync('/a/b.js', '');
    fs.writeFileSync('/a/c.js', '');
  });

  it('should create workspace', function() {
    expect(w).toBeDefined();
  });

  it('should get list of project files', function(done) {
    w.ls('**/*.js')
      .then(files => {
        expect(files).toEqual(['/a/b.js', '/a/c.js']);
        done();
      })
      .catch(done);
  });

  it('should parse file', function(done) {
    w.parse('/a/b.js')
      .then(node => {
        expect(node).toBeDefined();
        done();
      })
      .catch(done);
  });

  it('should transform file and save changes', function(done) {
    fs.writeFileSync('/a/b.js', 'var x = 1; x;');

    w.transform('/a/b.js', node => rename(node, 'x', 'y'))
      .then(() => w.read('/a/b.js'))
      .then(code => {
        expect(code.toString()).toEqual('var y = 1; y;');
        done();
      })
      .catch(done);
  });
});
