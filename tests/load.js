// Loads the interpreter sources into one context and exports CPP.
const fs = require("fs"), path = require("path"), vm = require("vm");
const SRC = path.join(__dirname, "..", "src");
const files = ["cpp_lex.js", "cpp_parse.js", "cpp_check.js", "cpp_run.js"];
const code = files.map((f) => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n;\n") + "\n;CPP;";
const ctx = { console, BigInt, DataView, ArrayBuffer, Int32Array, Set, Map, Math, Date, JSON, Object, Array, String, Number, RangeError };
vm.createContext(ctx);
const CPP = vm.runInContext(code, ctx, { filename: "cpp.js" });
module.exports = CPP;
