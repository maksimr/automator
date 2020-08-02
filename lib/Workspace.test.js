const Workspace = require("./Workspace").Workspace;
const fs = require("fs");

describe("Workspace", function() {
  it("should create workspace", function() {
    const w = new Workspace("/a", { reader: fs });
    expect(w).toBeDefined();
  });
});
