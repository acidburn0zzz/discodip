const test = require("ava");
const fs = require("fs");
const rimraf = require("rimraf");
const build = require("../index");

const OUTPUT = "test/tmp/render/";

rimraf.sync(OUTPUT);

test("basic render", async t => {
  return new Promise((resolve, reject) => {
    build({
      silent: true,
      output: OUTPUT,
      components: "test/fixtures/components.json",
      headHtml: "<style>body{background:red}</style>",
      bodyHtml: "<script>//hello</script>",
      onComplete: () => {
        t.true(
          fs.existsSync("test/tmp/render/component1.html"),
          "component1 HTML exists"
        );
        t.true(
          fs.existsSync("test/tmp/render/component1.json"),
          "component1 JSON exists"
        );
        t.true(
          fs.existsSync("test/tmp/render/component2.html"),
          "component2 HTML exists"
        );
        t.true(
          fs.existsSync("test/tmp/render/component2.json"),
          "component2 JSON exists"
        );
        t.true(
          fs.existsSync("test/tmp/render/component3.html"),
          "component3 HTML exists"
        );
        t.true(
          fs.existsSync("test/tmp/render/component3.json"),
          "component3 JSON exists"
        );
        t.true(
          fs.existsSync("test/tmp/render/.config.json"),
          "config JSON exists"
        );

        setTimeout(() => {
          for (var i = 1, l = 3; i <= l; ++i) {
            const html = fs
              .readFileSync(`test/tmp/render/component${i}.html`)
              .toString();
            t.true(html.indexOf(`<title>component${i}</title>`) > -1);
            t.true(html.indexOf(`<style>body{background:red}</style>`) > -1);
            t.true(html.indexOf(`<script>//hello</script>`) > -1);

            const json = fs
              .readFileSync(`test/tmp/render/component${i}.json`)
              .toString();

            switch (i) {
              case 1:
                t.is(
                  json,
                  '{"name":"component1","slug":"component1","height":0,"description":"<p>this is component 1 description</p>","source":"<p>this is component 1</p>"}'
                );
                break;
              case 2:
                t.is(
                  json,
                  '{"name":"component2","slug":"component2","height":0,"description":"<p>this is component 2 description</p>","source":"<p>this is component 2</p>"}'
                );
                break;
              case 3:
                t.is(
                  json,
                  '{"name":"component3","slug":"component3","height":0,"description":"<p>this is component 3 description</p>","source":"<p style=\'height: 111px\'>this is component 3</p>"}'
                );
                break;
            }
          }
          resolve();
        }, 2000);
      }
    });
  });
});
