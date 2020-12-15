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
    fs.writeFileSync('/a/b.css', '.foo { color: red; }');
    fs.writeFileSync('/a/b.html', '');
    fs.writeFileSync('/a/c.js', '');
    fs.mkdirSync('/a/x');
    fs.writeFileSync('/a/x/b.js', '');

    ws = new Workspace('/a', {reader: fs});
  });

  it('should create workspace', function() {
    expect(ws).toBeDefined();
  });

  it('should get list of project files', function(done) {
    ws.ls('**/*.js')
      .then(files => {
        expect(files).toEqual(['/a/b.js', '/a/c.js', '/a/x/b.js']);
        done();
      })
      .catch(done);
  });

  it('should expand relative to workspace directory', function(done) {
    ws.ls('*.js')
      .then(files => {
        expect(files).toEqual(['/a/b.js', '/a/c.js']);
        done();
      })
      .catch(done);
  });

  it('should allow to use absolute path as glob patter', function(done) {
    ws.ls('/a/b.js')
      .then(files => {
        expect(files).toEqual(['/a/b.js']);
        done();
      })
      .catch(done);
  });

  it('should parse JS file', function(done) {
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

  it('should parse and transform HTML file', function(done) {
    fs.writeFileSync('/a/b.html', '<div> B </div>');

    ws.transform('/a/b.html', (node) => node)
      .then(() => ws.read('/a/b.html'))
      .then(code => {
        expect(code.toString()).toEqual('<div> B </div>');
        done();
      })
      .catch(done);
  });

  it('should parse CSS file', function(done) {
    ws.transform('/a/b.css', (node) => node).then(code => {
      expect(code).toEqual('.foo {\n  color: red;\n}');
      done();
    }).catch(done);
  });
});
