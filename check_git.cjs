const cp = require("child_process");
console.log(cp.execSync("git ls-files src/components/ui/").toString());
