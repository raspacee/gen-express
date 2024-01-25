#!/usr/bin/env node
import { exit } from "process";
import fs from "fs";
import path from "path";
import parse_args from "./parse_args.js";
import {
  generate_controller,
  generate_index,
  generate_package,
  generate_router,
} from "./generators.js";
import type { ControllerFile, IndexFile, PackageFile } from "./types.js";
import {
  pugTemplate,
  pugTemplateCSS,
  ejsTemplate,
  ejsTemplateCSS,
  mustacheTemplate,
  mustacheTemplateCSS,
  nunjucksTemplate,
  nunjucksTemplateCSS,
} from "./view_templates.js";
import { cssTemplate, scssTemplate, stylusTemplate } from "./css_templates.js";
import { postgresTemplate } from "./db_templates.js";

const VERSION: string = "1.0.4";

function main(): void {
  let messageBuffer = "";

  if (
    process.argv.length < 3 ||
    (process.argv[2] != "-h" && process.argv[2][0] == "-")
  ) {
    console.log("Usage not correct: run `spawn-express-app -h` for help");
    exit(-1);
  }

  let args: string[] = parse_args(process.argv);
  if (args[0] == "-h") {
    console.log(`spawn-express-app: version ${VERSION}
            Usage:
            spawn-express-app [DIRECTORY-NAME] [OPTIONS]
            Example:
            spawn-express-app my_webapp -e -n -v=ejs

            Options:
            -e:                         add 'dotenv' environment variable support
            -n:                         add nodemon
            -v=[OPTION]                 add view engine support (pug, ejs, mustache, nunjucks)
            -c=[OPTION]                 add css support (css, sass)
            -d=[OPTION]                 add db support (postgres)
        `);
    exit(0);
  }

  if (fs.existsSync(args[0])) {
    console.log(`Directory '${args[0]}' already exists. Pick another name`);
    exit(-1);
  }
  // Everything is fine can start working now
  messageBuffer += "Creating directories\n";
  fs.mkdirSync(args[0]);
  fs.mkdirSync(path.join(args[0], "controllers"));
  fs.mkdirSync(path.join(args[0], "routes"));

  messageBuffer += "Creating essential index files\n";
  // Initialize index.controller.js
  let indexController: ControllerFile = {
    requireChunks: ["const express = require('express')"],
    functionChunks: [],
  };

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

  // Initialize package.json
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
    dependencies: {
      express: "^4.18.2",
    },
    devDependencies: {},
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i].substring(0, 2)) {
      case "-e":
        indexJS.requireChunks.unshift('require("dotenv").config()');
        packageJSON.devDependencies["dotenv"] = "^16.3.1";
        fs.writeFileSync(path.join(args[0], ".env"), "YOUR_KEY=YOUR_VALUE");
        break;
      case "-n":
        packageJSON.devDependencies["nodemon"] = "^3.0.2";
        packageJSON.scripts["start-dev"] =
          "export NODE_ENV=development && nodemon index.js";
        break;
      case "-v":
        messageBuffer += "Creating view directories\n";
        const view = args[i].split("=")[1].toLowerCase();
        fs.mkdirSync(path.join(args[0], "views"));
        indexJS.initializeChunks.push("app.set('views', 'views');");
        let controllerMessage: string | null = null;
        let template: string;
        if (view == "pug") {
          packageJSON.dependencies["pug"] = "^3.0.2";
          indexJS.initializeChunks.push("app.set('view engine', 'pug');");

          // If css support is specified generate the template that links to css file
          args.includes("-c")
            ? (template = pugTemplate)
            : (template = pugTemplateCSS);
          fs.writeFileSync(path.join(args[0], "views", "index.pug"), template);
          controllerMessage =
            "The five boxing wizards jump quickly. This sentence contains all the alphabets!";
        } else if (view == "ejs") {
          packageJSON.dependencies["ejs"] = "^3.1.9";
          indexJS.initializeChunks.push("app.set('view engine', 'ejs');");

          // If css support is specified generate the template that links to css file
          args.includes("-c")
            ? (template = ejsTemplateCSS)
            : (template = ejsTemplate);
          fs.writeFileSync(path.join(args[0], "views", "index.ejs"), template);
          controllerMessage =
            "The first website was by an organization called CERN, you can still view it here: http://info.cern.ch";
        } else if (view == "mustache") {
          packageJSON.dependencies["mustache"] = "^4.2.0";
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
          indexJS.initializeChunks.push('app.set("view engine", "html");');
          args.includes("-c")
            ? (template = mustacheTemplate)
            : (template = mustacheTemplateCSS);
          fs.writeFileSync(path.join(args[0], "views", "index.html"), template);
          controllerMessage =
            "https://cloud.githubusercontent.com/assets/288977/8779228/a3cf700e-2f02-11e5-869a-300312fb7a00.gif";
        } else if (view == "nunjucks") {
          packageJSON.dependencies["nunjucks"] = "^3.2.4";
          indexJS.requireChunks.push(`const nunjucks = require("nunjucks");`);
          indexJS.initializeChunks.push(`nunjucks.configure('views', {
    express: app,
    autoescape: true
});
app.set('view engine', 'html');`);
          args.includes("-c")
            ? (template = nunjucksTemplate)
            : (template = nunjucksTemplateCSS);
          fs.writeFileSync(path.join(args[0], "views", "index.html"), template);
          controllerMessage =
            "There is no McDonald's in Iceland. sad american noises :(";
        } else {
          messageBuffer +=
            "Failed to initialize view engine, invalid view engine specified : " +
            view +
            "\n";
          //TODO: unlink view directory
        }
        if (
          view == "pug" ||
          view == "ejs" ||
          view == "nunjucks" ||
          view == "mustache"
        ) {
          indexController.functionChunks
            .push(`exports.get_handler = (req, res, next) => {
    res.render('index', { message: '${controllerMessage}' })
}`);
        }
        break;
      case "-c":
        messageBuffer += "Initializing CSS\n";
        const style = args[i].split("=")[1].toLowerCase();
        fs.mkdirSync(path.join(args[0], "public", "styles"), {
          recursive: true,
        });
        indexJS.initializeChunks.push(
          'app.use("/assets", express.static("public"));'
        );
        if (style == "css") {
          fs.writeFileSync(
            path.join(args[0], "public", "styles", "index.css"),
            cssTemplate
          );
        } else if (style == "sass") {
          fs.mkdirSync(path.join(args[0], "scss"));
          fs.writeFileSync(
            path.join(args[0], "scss", "index.scss"),
            scssTemplate
          );
          packageJSON.dependencies["sass"] = "^1.69.7";
          packageJSON.scripts["scss"] = "sass --watch scss:public/styles";
        } else if (style == "stylus") {
          fs.mkdirSync(path.join(args[0], "stylus"));
          fs.writeFileSync(
            path.join(args[0], "stylus", "index.styl"),
            stylusTemplate
          );
          packageJSON.dependencies["stylus"] = "^0.62.0";
          packageJSON.scripts["stylus"] =
            "stylus -w stylus --out public/styles";
        } else {
          //TODO: unlink public directory
          messageBuffer +=
            "Failed to initialize CSS, invalid CSS option specified\n";
        }
        break;
      case "-d":
        messageBuffer += "Initializing database\n";
        const db = args[i].split("=")[1].toLowerCase();
        fs.mkdirSync(path.join(args[0], "db"));
        if (db == "postgres") {
          fs.writeFileSync(
            path.join(args[0], "db", "index.js"),
            postgresTemplate
          );
          packageJSON.dependencies["pg"] = "^8.11.3";
          indexController.requireChunks.push(
            "const { query, pool } = require('../db/index.js');"
          );
        } else {
          messageBuffer +=
            "Failed to initialize db, invalid db option specified\n";
        }
        break;
    }
  }

  generate_router(args);
  generate_controller(args, indexController);
  generate_index(args, indexJS);
  generate_package(args, packageJSON);
  messageBuffer += `Project '${args[0]}' successfully created\n`;
  messageBuffer += `\nTo initialize the project run: \n`;
  messageBuffer += `cd ${args[0]} && npm install\n`;
  messageBuffer += `To start the project run: \n`;
  messageBuffer += `npm run start`;
  console.log(messageBuffer);
}

main();
