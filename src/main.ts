import { exit } from "process";
import fs from "fs";
import path from "path";

const VERSION: string = "1.0.0";

/* Divide a file into separate parts/chunks.
 * so we can dynamically add/remove lines from the
 * code according to the arguments
 */
interface IndexFile {
  requireChunks: string[];
  initializeChunks: string[];
  middlewareChunks: string[];
  routingChunks: string[];
  footerChunks: string[];
}

interface PackageFile {
  name: string;
  version: string;
  description: string;
  main: string;
  scripts: object;
  keywords: string[];
  author: string;
  license: string;
  dependencies: object;
  devDependencies?: object;
}

interface Dependency {
  [key: string]: string;
}

function main(): void {
  if (process.argv.length < 3) {
    console.log("Usage not correct: run `generate-express -h` for help");
    exit(-1);
  }

  let args: string[] = parse_args(process.argv);
  if (args[0] == "-h") {
    console.log(`generate-express: version ${VERSION}
            Usage:
            generate-express [DIRECTORY-NAME] [OPTIONS]
            generate-express -h or generate-express --help

            Options:
            -e:                         add 'dotenv' environment variable support 
        `);
    exit(0);
  }

  // Everything is fine can start working now
  if (fs.existsSync(args[0])) {
    console.log(`Directory '${args[0]}' already exists. Pick another name`);
    exit(-1);
  }
  fs.mkdirSync(args[0]);
  fs.mkdirSync(path.join(args[0], "controllers"));
  fs.mkdirSync(path.join(args[0], "routes"));

  const indexControllerData = `exports.get_handler = (req, res, next) => {
return res.status(200).send("Hi :), this was generated using generate-express");
}
  `;
  fs.writeFile(
    path.join(args[0], "controllers", "index.controller.js"),
    indexControllerData,
    (err) => {
      if (err) {
        console.error(err);
        exit(-1);
      }
    }
  );

  const indexRouteData = `const router = require("express").Router();
const indexController = require("../controllers/index.controller.js");

router.get("/", indexController.get_handler);

module.exports = router;`;
  fs.writeFile(
    path.join(args[0], "routes", "index.router.js"),
    indexRouteData,
    (err) => {
      if (err) {
        console.error(err);
        exit(-1);
      }
    }
  );

  let dependencies: Dependency = { express: "^4.18.2" };
  let devDependencies: Dependency = {};

  let indexJS: IndexFile = {
    requireChunks: [
      'const express = require("express");',
      'const indexRouter = require("./routes/index.router.js");',
    ],
    initializeChunks: ["const app = express();"],
    middlewareChunks: [
      "app.use(express.json());",
      "app.use(express.urlencoded({ extended: true }));",
    ],
    routingChunks: ['app.use("/", indexRouter);'],
    footerChunks: [
      `app.listen(3000, () => console.log("Application listening on port: " + 3000))`,
    ],
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case "-e":
        indexJS.requireChunks.unshift('require("dotenv").config()');
        devDependencies["dotenv"] = "^16.3.1";
        fs.writeFileSync(path.join(args[0], ".env"), "YOUR_KEY=YOUR_VALUE");
    }
  }

  // Generate index.js
  const indexFD: number = fs.openSync(path.join(args[0], "index.js"), "w");
  for (const key in indexJS) {
    indexJS[key as keyof IndexFile].forEach((line) => {
      line = line + "\n";
      fs.appendFileSync(indexFD, line);
    });
    fs.appendFileSync(indexFD, "\n");
  }
  fs.closeSync(indexFD);

  // Generate package.json
  let packageJSON: PackageFile = {
    name: path.join(args[0]),
    version: "1.0.0",
    description: "",
    main: "index.js",
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    keywords: [],
    author: "",
    license: "ISC",
    dependencies: dependencies,
  };
  if (Object.keys(devDependencies).length > 0)
    packageJSON.devDependencies = devDependencies;

  fs.writeFile(
    path.join(args[0], "package.json"),
    JSON.stringify(packageJSON, null, 2),
    (err) => {
      if (err) {
        console.error(err);
        exit(-1);
      }
    }
  );
}

// Removes any invalid arguments and returns valid arguments only
function parse_args(argv: string[]): string[] {
  let args: string[] = [];
  if (argv[2] != "-h") args.push(argv[2]);
  const re: RegExp = /^-[a-zA-Z]$/;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].match(re)) {
      args.push(argv[i]);
    }
  }
  return args;
}

main();
