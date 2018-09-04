const test = require("ava");
const fs = require("fs");
const rimraf = require("rimraf");
const build = require("../index");

const OUTPUT = "test/tmp/unused/";

rimraf.sync(OUTPUT);

test("remove unused items", async t => {
  return new Promise((resolve, reject) => {
    build({
      silent: true,
      output: OUTPUT,
      components: "test/fixtures/components.json",
      onComplete: () => {
        build({
          silent: true,
          output: OUTPUT,
          components: "test/fixtures/components2.json",
          onComplete: () => {
            t.true(
              fs.existsSync("test/tmp/unused/component1.html"),
              "component1 HTML exists"
            );
            t.true(
              fs.existsSync("test/tmp/unused/component1.json"),
              "component1 JSON exists"
            );
            t.true(
              fs.existsSync("test/tmp/unused/component2.html"),
              "component2 HTML exists"
            );
            t.true(
              fs.existsSync("test/tmp/unused/component2.json"),
              "component2 JSON exists"
            );
            t.false(
              fs.existsSync("test/tmp/unused/component3.html"),
              "component3 HTML doesn't exist"
            );
            t.false(
              fs.existsSync("test/tmp/unused/component3.json"),
              "component3 JSON doesn't exist"
            );
            t.true(
              fs.existsSync("test/tmp/unused/.config.json"),
              "component3 JSON exists"
            );

            resolve();
          }
        });
      }
    });
  });
});
