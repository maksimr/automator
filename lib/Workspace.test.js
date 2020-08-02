const Workspace = require("./Workspace").Workspace;
const fs = require("memfs");

describe("Workspace", function() {
  it("should create workspace", function() {
    const w = new Workspace("/a", { reader: fs });
    expect(w).toBeDefined();
  });
});
