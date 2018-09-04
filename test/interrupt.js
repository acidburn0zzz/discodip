const test = require("ava");
const build = require("../index");
const rimraf = require("rimraf");

const OUTPUT = "test/tmp/interrupt/";

rimraf.sync(OUTPUT);

test("prerender", async t => {
  return new Promise((resolve, reject) => {
    build({
      silent: true,
      output: OUTPUT,
      components: "test/fixtures/components.json",
      prerender: {},
      onComplete: () => {
        t.fail();
        reject();
      }
    });

    setTimeout(() => {
      build({
        silent: true,
        output: OUTPUT,
        components: "test/fixtures/components.json",
        prerender: {},
        onComplete: () => {
          t.fail();
          reject();
        }
      });
    }, 250);

    setTimeout(() => {
      build({
        silent: true,
        output: OUTPUT,
        components: "test/fixtures/components.json",
        prerender: {},
        onComplete: () => {
          t.pass();
          resolve();
        }
      });
    }, 500);
  });
});
