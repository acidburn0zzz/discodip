const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const cp = require("child_process");
const ON_DEATH = require("death")({ uncaughtException: true });
const killable = require("killable");
const mkdirp = require("mkdirp");

const http = require("http");
const finalhandler = require("finalhandler");
const serveStatic = require("serve-static");

const TEMPLATE = fs.readFileSync(`${__dirname}/../TEMPLATE.html`, "utf8");

/**
 * This renders all individual components
 * for every component a .html file and .json
 * file are generated
 */

const args = JSON.parse(process.argv[2]);
const options = args.options;
const paths = args.paths;

const queue = [];

mkdirp.sync(paths.output);

/**
 * read components JSON file and parse JSON
 */

let components = null;
components = fs.readFileSync(paths.components, "utf8");
try {
  components = JSON.parse(components);
} catch (err) {
  throw new Error(`Error parsing JSON ${options.components}`);
  process.exit();
}

/**
 * Loop over all components and find subexamples to be rendered
 * alongside main examples
 */

for (let i = 0, l = components.length; i < l; ++i) {
  if (components[i].subexamples && components[i].subexamples.length) {
    components = components.concat(components[i].subexamples);
  }
}

/**
 * Loop over all components and setup render queue
 */

for (i = 0, l = components.length; i < l; ++i) {
  const component = components[i];
  const file = `${paths.output}/${slugify(component.meta.name)}`;

  // check if file contains newer data
  let isNewer = false;
  let prevComponentJSON = null;

  if (!options.force) {
    if (fs.existsSync(`${file}.json`)) {
      prevComponentJSON = fs.readFileSync(`${file}.json`, "utf8");
      try {
        prevComponentJSON = JSON.parse(prevComponentJSON);

        // check if name, description or source are newer
        if (
          prevComponentJSON.name !== component.meta.name ||
          prevComponentJSON.description !== component.meta.description ||
          prevComponentJSON.source !== component.output
        ) {
          isNewer = true;
        }
      } catch (err) {
        isNewer = true;
      }
    } else {
      isNewer = true;
    }
  }

  // if force is on or the file should update
  if (options.force || isNewer) {
    // create html output string
    const componentHTML = TEMPLATE.replace("{{output}}", component.output || "")
      .replace("{{headHtml}}", options.headHtml || "")
      .replace("{{bodyHtml}}", options.bodyHtml || "")
      .replace("{{title}}", component.meta.name);

    // create json output string
    const componentJSON = {
      name: component.meta.name,
      slug: slugify(component.meta.name),
      height: 0,
      description: component.meta.description,
      source: component.output
    };

    queue.push({
      name: component.meta.name,
      slug: slugify(component.meta.name),
      file: file,
      json: componentJSON,
      html: componentHTML
    });
  }
}

if (queue.length === 1) {
  process.send(`warn::Found 1 changed component`);
} else {
  process.send(`warn::Found ${queue.length} changed components`);
}

/**
 * Start prerender server
 */

let puppet;
let server;
let serve;

// if the prerender option is set
if (typeof options.prerender === "object" && options.prerender !== null) {
  // set defaults for prerender
  options.prerender.port = options.prerender.port || 3000;
  options.prerender.path = options.prerender.path || "";
  options.prerender.serveFolder = options.prerender.serveFolder || "";

  // open puppeteer
  puppet = cp.fork(`${__dirname}/puppeteer.js`, [], { silent: true });

  // wait for puppeteer-ready 'event'
  puppet.once("message", data => {
    if (data === "puppeteer-ready") {
      // start static file server
      serve = serveStatic(path.resolve(options.prerender.serveFolder));
      server = http.createServer((req, res) => {
        const done = finalhandler(req, res);
        serve(req, res, done);
      });

      server.listen(options.prerender.port);
      killable(server);

      server.on("error", err => {});

      process.on("exit", quit);
      process.on("SIGINT", quit);

      // when ready, start render queue
      server.on("listening", () => {
        render(queue.slice(0));
      });
    }
  });

  // no prerendering, start render queue
} else {
  render(queue.slice(0));
}

/**
 * Recursive render
 * generates component html file
 * and json file after that
 */

function render(q) {
  if (!q.length) {
    complete();
    return;
  }

  const item = q.shift();

  // render HTML file
  fs.writeFile(`${item.file}.html`, item.html, err => {
    if (err) throw err;

    // if prerendering is enabled
    if (typeof options.prerender === "object" && options.prerender !== null) {
      // wait for response from browser
      puppet.once("message", height => {
        // store height
        item.json.height = height;

        // render JSON file
        fs.writeFile(`${item.file}.json`, JSON.stringify(item.json), err => {
          if (err) throw err;
          process.send(`success::Generated ${item.name}`);

          // render next
          render(q);
        });
      });

      // open html file in browser
      puppet.send({
        url: `http://localhost:${options.prerender.port}/${
          options.prerender.path
        }/${item.slug}.html`
      });

      // if no prerendering is to be done
    } else {
      // render JSON file
      fs.writeFile(`${item.file}.json`, JSON.stringify(item.json), err => {
        if (err) throw err;
        process.send(`success::Generated ${item.name}`);

        // render next
        render(q);
      });
    }
  });
}

/**
 * Clean up unused files and shut down
 */

function complete() {
  quit();

  const deleteQueue = [];
  fs.readdir(paths.output, (err, files) => {
    if (files) {
      // lookup array for quick search inside existing component names
      const componentsLookup = components.map(item => {
        return slugify(item.meta.name);
      });

      // loop over files
      for (let i = 0, l = files.length; i < l; ++i) {
        const file = files[i];
        const ext = path.extname(file);

        // ignore dot files
        if (file.indexOf(".") === 0) {
          continue;
        }

        // if json+html file isn't inside lookup, mark for deletion
        if (componentsLookup.indexOf(path.basename(file, ext)) === -1) {
          deleteQueue.push(file);
        }
      }
    }

    // remove file by passing shorter queue
    function removeFile(q) {
      if (!q.length) {
        process.send(true);
        return;
      }

      const file = q.shift();
      rimraf(path.resolve(paths.output, file), { read: false }, () => {
        removeFile(q);
      });
    }

    removeFile(deleteQueue);
  });
}

/**
 * Basic slugify function
 * Used to build the output filenames
 */

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Graceful quit
 */

function quit() {
  if (puppet) {
    puppet.kill("SIGINT");
    puppet = null;
  }

  if (server) {
    server.kill();
  }

  process.removeListener("exit", quit);
  process.removeListener("SIGINT", quit);
}

ON_DEATH((signal, err) => {
  process.exit();
});
