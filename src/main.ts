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
  scripts: PackageScript;
  keywords: string[];
  author: string;
  license: string;
  dependencies: PackageDependency;
  devDependencies?: PackageDependency;
}

interface ControllerFile {
  functionChunks: string[];
}

interface PackageDependency {
  [packageName: string]: string;
}

interface PackageScript {
  [scriptName: string]: string;
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
            Example:
            generate-express my_webapp -e -n

            Options:
            -e:                         add 'dotenv' environment variable support 
            -n:                         add nodemon
            -v=[OPTION]                 add view engine support (pug, ejs, mustache, nunjucks)
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

  //   const indexControllerData = `exports.get_handler = (req, res, next) => {
  // return res.status(200).send("Hi :) this was generated using generate-express");
  // }`;
  let indexController: ControllerFile = {
    functionChunks: [],
  };

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

  // Initialize package.json contents
  let dependencies: PackageDependency = { express: "^4.18.2" };
  let devDependencies: PackageDependency = {};

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
    routingChunks: [
      'app.use("/", indexRouter);',
      `app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.status(400).send(err);
});`,
    ],
    footerChunks: [
      `app.listen(3000, () => console.log("Application listening on port: " + 3000))`,
    ],
  };

  let packageJSON: PackageFile = {
    name: path.join(args[0]),
    version: "1.0.0",
    description: "",
    main: "index.js",
    scripts: {
      start: "export NODE_ENV=production && node index.js",
    },
    keywords: [],
    author: "",
    license: "ISC",
    dependencies: dependencies,
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i].substring(0, 2)) {
      case "-e":
        indexJS.requireChunks.unshift('require("dotenv").config()');
        devDependencies["dotenv"] = "^16.3.1";
        fs.writeFileSync(path.join(args[0], ".env"), "YOUR_KEY=YOUR_VALUE");
        break;
      case "-n":
        devDependencies["nodemon"] = "^3.0.2";
        packageJSON.scripts["start-dev"] =
          "export NODE_ENV=development && nodemon index.js";
        break;
      case "-v":
        const view = args[i].split("=")[1].toLowerCase();
        if (view == "pug") {
          dependencies["pug"] = "^3.0.2";
          fs.mkdirSync(path.join(args[0], "views"));
          indexJS.initializeChunks.push("app.set('views', 'views');");
          indexJS.initializeChunks.push("app.set('view engine', 'pug');");

          let pugData = `html
head
    title= title
body
    h1= message`;
          fs.writeFileSync(path.join(args[0], "views", "index.pug"), pugData);
          indexController.functionChunks
            .push(`exports.get_handler = (req, res, next) => {
    res.render('index', { title: 'This sentence contains all the alphabets!', message: 'The five boxing wizards jump quickly' })
}`);
        } else if (view == "ejs") {
          dependencies["ejs"] = "^3.1.9";
          fs.mkdirSync(path.join(args[0], "views"));
          indexJS.initializeChunks.push("app.set('views', 'views');");
          indexJS.initializeChunks.push("app.set('view engine', 'ejs');");

          let ejsData = `<html>
  <body>
    <%= message %>
  </body>
</html>`;
          fs.writeFileSync(path.join(args[0], "views", "index.ejs"), ejsData);
          indexController.functionChunks
            .push(`exports.get_handler = (req, res, next) => {
    res.render('index', { message: 'The first website was by an organization called CERN, you can still view it here: <a href="http://info.cern.ch">http://info.cern.ch</a>' })
}`);
        } else if (view == "mustache") {
          dependencies["mustache"] = "^4.2.0";
          fs.mkdirSync(path.join(args[0], "views"));
          indexJS.requireChunks.push(`const Mustache = require("mustache");
const fs = require("fs");
          `);
          indexJS.initializeChunks
            .push(`app.engine("html", function (filePath, options, callback) {
  fs.readFile(filePath, function (err, content) {
    if (err) return callback(err);
    const rendered = Mustache.render(content.toString(), options);
    return callback(null, rendered);
  });
});
          `);
          indexJS.initializeChunks.push(`app.set("views", "views");
app.set("view engine", "html");
          `);
          let mustacheData = `<html>
  <body>
    <img src="{{ message }}">
  </body>
</html>`;
          fs.writeFileSync(
            path.join(args[0], "views", "index.html"),
            mustacheData
          );
          indexController.functionChunks
            .push(`exports.get_handler = (req, res, next) => {
    res.render('index', { message: 'https://cloud.githubusercontent.com/assets/288977/8779228/a3cf700e-2f02-11e5-869a-300312fb7a00.gif' })
}`);
        } else if (view == "nunjucks") {
          dependencies["nunjucks"] = "^3.2.4";
          fs.mkdirSync(path.join(args[0], "views"));
          indexJS.requireChunks.push(`const nunjucks = require("nunjucks");`);
          indexJS.initializeChunks.push(`nunjucks.configure('views', {
    express: app,
    autoescape: true
});
app.set('view engine', 'html');`);
          let nunjucks = `<html>
  <body>
    <h1>{{ message }}</h1>
  </body>
</html>`;
          fs.writeFileSync(path.join(args[0], "views", "index.html"), nunjucks);
          indexController.functionChunks
            .push(`exports.get_handler = (req, res, next) => {
    res.render('index', { message: "There is no McDonald's in Iceland. sad american noises :(" })
}`);
        } else {
          console.log(
            "Invalid view engine specified, failed to initialize view engine :" +
              view
          );
        }
        break;
    }
  }

  // Generate controller
  if (indexController.functionChunks.length == 0) {
    indexController.functionChunks
      .push(`exports.get_handler = (req, res, next) => {
    return res.status(200).send('Linux was first named FREAX, fortunately someone convinced him to change the name to Linux. phew!');
}`);
  }
  const controllerFD: number = fs.openSync(
    path.join(args[0], "controllers", "index.controller.js"),
    "w"
  );
  for (const key in indexController) {
    indexController[key as keyof ControllerFile].forEach((line) => {
      line = line + "\n";
      fs.appendFileSync(controllerFD, line);
    });
  }
  fs.closeSync(controllerFD);

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
  const re2: RegExp = /-[A-Za-z]=[A-Za-z]+/;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].match(re) || argv[i].match(re2)) {
      args.push(argv[i]);
    }
  }
  return args;
}

main();
