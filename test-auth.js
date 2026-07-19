const fs = require("fs");
const path = require("path");

async function main() {
  const distAuthPath = path.join(__dirname, "dist", "config", "auth.js");

  if (fs.existsSync(distAuthPath)) {
    const { getAuth } = require(distAuthPath);
    const auth = await getAuth();
    console.log(auth ? "Auth works!" : "Auth is null");
    return;
  }

  require("ts-node/register/transpile-only");
  const { getAuth } = require("./src/config/auth");
  const auth = await getAuth();
  console.log(auth ? "Auth works!" : "Auth is null");
}

main().catch((err) => {
  console.error("Auth Failed!", err);
  process.exit(1);
});
