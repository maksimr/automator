global.Error = Error;
global.TypeError = TypeError;
global.RangeError = RangeError;

const memfs = require('memfs');
const Workspace = require('./Workspace').Workspace;
const rename = require('./node/rename');

describe('Workspace', function() {
  let ws = null;
  let fs = null;

  beforeEach(function() {
    fs = memfs.createFsFromVolume(new memfs.Volume());
    fs.mkdirSync('/a');
    fs.writeFileSync('/a/b.js', '');
    fs.writeFileSync('/a/c.js', '');

    ws = new Workspace('/a', { reader: fs });
  });

  it('should create workspace', function() {
    expect(ws).toBeDefined();
  });

  it('should get list of project files', function(done) {
    ws.ls('**/*.js')
      .then(files => {
        expect(files).toEqual(['/a/b.js', '/a/c.js']);
        done();
      })
      .catch(done);
  });

  it('should parse file', function(done) {
    ws.parse('/a/b.js')
      .then(node => {
        expect(node).toBeDefined();
        done();
      })
      .catch(done);
  });

  it('should transform file and save changes', function(done) {
    fs.writeFileSync('/a/b.js', 'var x = 1; x;');

    ws.transform('/a/b.js', node => rename(node, 'x', 'y'))
      .then(() => ws.read('/a/b.js'))
      .then(code => {
        expect(code.toString()).toEqual('var y = 1; y;');
        done();
      })
      .catch(done);
  });
});
