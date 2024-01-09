import fs from "fs";
import path from "path";
import { exit } from "process";
import type {
  ControllerFile,
  IndexFile,
  PackageFile,
  PackageDependency,
} from "./types.d.ts";

// Generate index.controller.js
function generate_controller(args: string[], indexController: ControllerFile) {
  // If no view engine was specified return a normal 200 response with text only
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
}

// Generate index.js
function generate_index(args: string[], indexJS: IndexFile) {
  const indexFD: number = fs.openSync(path.join(args[0], "index.js"), "w");
  for (const key in indexJS) {
    indexJS[key as keyof IndexFile].forEach((line) => {
      line = line + "\n";
      fs.appendFileSync(indexFD, line);
    });
    fs.appendFileSync(indexFD, "\n");
  }
  fs.closeSync(indexFD);
}

// Generate package.json
function generate_package(args: string[], packageJSON: PackageFile) {
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

/* Generate index.router.js
 * since index.router.js is a static file, its content is same for every option
 * it was not necessary to divide this file into separate chunks
 */
function generate_router(args: string[]) {
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
}

export {
  generate_controller,
  generate_index,
  generate_package,
  generate_router,
};
