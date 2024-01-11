/* Divide a file into separate parts/chunks.
 * so we can dynamically add/remove lines from the
 * code according to the arguments
 */

interface ControllerFile {
  requireChunks: string[];
  functionChunks: string[];
}

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
  devDependencies: PackageDependency;
}

interface PackageDependency {
  [packageName: string]: string;
}

interface PackageScript {
  [scriptName: string]: string;
}

export { ControllerFile, IndexFile, PackageFile, PackageDependency };
