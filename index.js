const mkdirp = require("mkdirp");
const signale = require("signale");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

/**
 * Build
 */

let renderer = null;

function build(config) {
  if (renderer) {
    renderer.kill();
    renderer = null;
  }

  const options = Object.assign(
    {
      silent: false,
      components: null,
      force: false,
      output: null,
      componentHeadHtml: "",
      componentBodyHtml: "",
      prerender: null,
      onComplete: null
    },
    config
  );

  if (options.silent) {
    signale.disable();
  }

  // fail if no output dir option is given
  if (!options.output) {
    throw new Error("options.output is required");
  }

  // fail if no output dir option is given
  if (!options.components) {
    throw new Error("options.components is required");
  }

  // resolve paths
  const paths = {
    output: path.resolve(options.output),
    components: path.resolve(options.components),
    config: path.resolve(options.output, ".config.json")
  };

  // check if previous configuration exists
  // if it does, compare to current config
  // if it isn't the same, force rebuild
  let prevConfig = null;
  if (fs.existsSync(paths.config)) {
    prevConfig = fs.readFileSync(paths.config, "utf8");
  }

  mkdirp.sync(paths.output);
  fs.writeFileSync(paths.config, JSON.stringify(options));

  if (prevConfig !== JSON.stringify(options)) {
    signale.warn("Detected changed configuration");
    options.force = true;
  }

  // read components JSON file
  // and parse JSON
  let componentsJSON = null;
  if (fs.existsSync(paths.components)) {
    componentsJSON = fs.readFileSync(paths.components, "utf8");
    try {
      componentsJSON = JSON.parse(componentsJSON);
    } catch (err) {
      throw new Error(`Error parsing JSON ${options.components}`);
    }
  } else {
    throw new Error(`Components file not found ${options.components}`);
  }

  // start rendering components
  renderer = cp.fork(
    `${__dirname}/lib/render.js`,
    [
      JSON.stringify({
        components: componentsJSON,
        options: options,
        paths: paths
      })
    ],
    {
      silent: true
    }
  );

  renderer.stderr.on("data", err => {
    signale.error(`\n${err}`);
  });

  renderer.on("message", message => {
    if (message === true) {
      renderer.kill();
      renderer = null;
      signale.success("Complete");
      if (typeof options.onComplete === "function") {
        options.onComplete();
      }
    } else {
      log(message);
    }
  });
}

module.exports = build;

/**
 * Logger
 */

function log(str) {
  const message = str.split("::");

  if (message[1]) {
    signale[message[0]](message[1]);
    return;
  }

  signale.log(message[0]);
}
