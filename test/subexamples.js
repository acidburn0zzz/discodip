const test = require("ava");
const fs = require("fs");
const rimraf = require("rimraf");
const build = require("../index");

const OUTPUT = "test/tmp/subexamples/";

rimraf.sync(OUTPUT);

test("render subexamples", async t => {
  return new Promise((resolve, reject) => {
    build({
      silent: true,
      output: OUTPUT,
      components: "test/fixtures/components3.json",
      onComplete: () => {
        t.true(
          fs.existsSync("test/tmp/subexamples/component-1.html"),
          "component1 HTML exists"
        );
        t.true(
          fs.existsSync("test/tmp/subexamples/component-1.json"),
          "component1 JSON exists"
        );
        t.true(
          fs.existsSync("test/tmp/subexamples/component-2.html"),
          "component2 HTML exists"
        );
        t.true(
          fs.existsSync("test/tmp/subexamples/component-2.json"),
          "component2 JSON exists"
        );
        t.true(
          fs.existsSync("test/tmp/subexamples/component-3.html"),
          "component3 HTML exists"
        );
        t.true(
          fs.existsSync("test/tmp/subexamples/component-3.json"),
          "component3 JSON exists"
        );

        resolve();
      }
    });
  });
});
