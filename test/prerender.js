const test = require("ava");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

const OUTPUT = "test/tmp/prerender/";

rimraf.sync(OUTPUT);

test("prerender", async t => {
  return new Promise((resolve, reject) => {
    const renderer = cp.fork(
      "lib/render.js",
      [
        JSON.stringify({
          components: require("./fixtures/components.json"),
          options: {
            force: true,
            output: OUTPUT,
            prerender: {
              port: 3000,
              path: "test/tmp/prerender",
              serveFolder: ""
            }
          },
          paths: {
            output: path.resolve(OUTPUT),
            components: path.resolve("test/fixtures/components.json"),
            config: path.resolve("test/tmp/prerender/.config.json")
          }
        })
      ],
      { silent: true }
    );

    renderer.on("message", message => {
      if (message === true) {
        renderer.kill();
        resolve();
      }
    });
  }).then(() => {
    t.is(require("./tmp/prerender/component1.json").height, 18);
    t.is(require("./tmp/prerender/component2.json").height, 18);
    t.is(require("./tmp/prerender/component3.json").height, 111);
  });
});
