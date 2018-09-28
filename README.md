# Discodip

![discodip](https://user-images.githubusercontent.com/580312/45072946-685d3500-b0dd-11e8-81f7-8b1792e1d9c8.png)

Embeddable-HTML-components generator.

Transforms a set of component name/description/HTML-source objects into separate .html-files, along with .json-files containing component meta information. Can be used for embedding standalone components inside a ~design-system~ ~styleguide~ ~pattern~ ~library~ thing.

---

## Install

First you need to install discodip.

```bash
> npm i discodip --save-dev
```

---

## Generate components.json

This is what the json file containing all components should look like. Use any tool you like to gather the necessary data, for example [Collect Components](https://www.npmjs.com/package/collect-components), [Pug-doc](https://www.npmjs.com/package/pug-doc) or [Gather Components](https://www.npmjs.com/package/gather-components).

```json
[
  {
    "meta": {
      "name": "my-component",
      "description": "this is my component description"
    },
    "output": "<div class=\"some-tag\">this is some html</div><div class=\"some-tag\">this is some more html</div>",
    "fragments": [
      {
        "meta": {
          "name": "my-component",
          "description": "this is my component description"
        },
        "output": "<div class=\"some-tag\">this is some more html</div>"
      }
    ]
  }
]
```

---

## Build

```js
const build = require("discodip");

build({
  output: "httpdocs/my-components/",
  components: "httpdocs/components.json",
  headHtml: "<style>body{background:red}</style>",
  bodyHtml: "<script>alert('hello')</script>",
  prerender: {
    port: 3000,
    path: "my-components/",
    serveFolder: "httpdocs/"
  },
  onComplete: () => {
    console.log("complete");
  }
});
```

Now you can iframe them wherever you like or use javascript to get the metadata first.

```html
<iframe src="/my-components/component1.html" frameborder="0" scrolling="no"></iframe>
```

---

## Options

| option                | default  | type     | description                                                                                                                                                                                                                                                    |
| --------------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **output**            | null     | string   | output directory                                                                                                                                                                                                                                               |
| **components**        | null     | string   | .json-file holding all components                                                                                                                                                                                                                              |
| headHtml              | ""       | string   | string of html to include in the body                                                                                                                                                                                                                          |
| bodyHtml              | ""       | string   | string of html to include in the head                                                                                                                                                                                                                          |
| prerender             | null     | object   | prerender all components to get their heights (at 1200px wide browser window, using Puppeteer). This speeds up the user interface and makes it less jumpy. However, this makes compiling slower because it needs to open all components in a headless browser. |
| prerender.port        | ""       | number   | static server port for rendering components (http://localhost:{port})                                                                                                                                                                                          |
| prerender.path        | ""       | string   | path to folder (http://localhost:{port}/{path})                                                                                                                                                                                                                |
| prerender.serveFolder | 3000     | string   | directory to start the static file server in                                                                                                                                                                                                                   |
| onComplete            | () => {} | function | function to be called when done                                                                                                                                                                                                                                |
| silent                | false    | boolean  | shut the terminal up                                                                                                                                                                                                                                           |
| force                 | false    | boolean  | always update all components. This disables smart checking for component re-evaluation.                                                                                                                                                                        |

---

## Output

For every component one .html file and one .json file will be generated inside the `options.output` folder. Also .config.json is generated to store configuration.

```
/output/
- /output/.config.json
- /output/component1.json
- /output/component1.html
- /output/component2.json
- /output/component2.html
```

```html
<!DOCTYPE html>
  <html style="margin: 0; padding: 0px;">
  <head>
    <base target="_blank">
    <title>component1</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/3.6.0/iframeResizer.contentWindow.min.js"></script>
    <script>(function templatePolyfill(){if("content"in document.createElement("template")){return false}var templates=document.getElementsByTagName("template");var plateLen=templates.length;for(var x=0;x<plateLen;++x){var template=templates[x];var content=template.childNodes;var fragment=document.createDocumentFragment();while(content[0]){fragment.appendChild(content[0])}template.content=fragment}})();</script>
    <style>template {  display: none !important; }</style>
    <style>body{background:red}</style>
  </head>
  <body style="margin: 0px; padding: 0px;">
    <p style='height: 111px'>this is component 3</p>
    <script>alert('hello')</script>
  </body>
</html>
```

```json
{
  "name": "component1",
  "slug": "component1",
  "height": 111,
  "description": "<p>this is component 1 description</p>",
  "source": "<p style='height: 111px'>this is component 1</p>"
}
```
