const test = require("ava");
const rimraf = require("rimraf");
const build = require("../index");

const OUTPUT = "test/tmp/config/";

rimraf.sync(OUTPUT);

test("options.output is required", t => {
  const error = t.throws(() => {
    build({
      silent: true
    });
  }, Error);
  t.is(error.message, "options.output is required");
});

test("options.components is required", t => {
  const error = t.throws(() => {
    build({
      silent: true,
      output: OUTPUT
    });
  }, Error);
  t.is(error.message, "options.components is required");
});

test("components JSON not found", t => {
  const error = t.throws(() => {
    build({
      silent: true,
      output: OUTPUT,
      components: "test/fixtures/components--.json"
    });
  }, Error);
  t.is(
    error.message,
    "Components file not found test/fixtures/components--.json"
  );
});

test("complete", async t => {
  return new Promise((resolve, reject) => {
    build({
      silent: true,
      output: OUTPUT,
      components: "test/fixtures/components.json",
      headHtml: "<style>body{background:red}</style>",
      bodyHtml: "<script>//hello</script>",
      onComplete: () => {
        t.pass();
        resolve();
      }
    });
  });
});
