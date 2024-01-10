let pugTemplate = `html
head
    title Hi :)
body
    h1= message`;

let pugTemplateCSS = `html
head
    title Hi :)
    link(rel='stylesheet', type='text/css', href='/assets/styles/index.css')
body
    h1= message`;

let ejsTemplate = `<html>
  <body>
    <%= message %>
  </body>
</html>`;

let ejsTemplateCSS = `<html>
  <head>
    <link rel="stylesheet" href="/assets/styles/index.css" />
  </head>
  <body>
    <%= message %>
  </body>
</html>`;

let mustacheTemplate = `<html>
  <body>
    <img src="{{ message }}">
  </body>
</html>`;

let mustacheTemplateCSS = `<html>
  <head>
    <link rel="stylesheet" href="/assets/styles/index.css" />
  </head>
  <body>
    <img src="{{ message }}">
  </body>
</html>`;

let nunjucksTemplate = `<html>
  <body>
    <h1>{{ message }}</h1>
  </body>
</html>`;

let nunjucksTemplateCSS = `<html>
  <head>
    <link rel="stylesheet" href="/assets/styles/index.css" />
  </head>
  <body>
    <h1>{{ message }}</h1>
  </body>
</html>`;

export {
  pugTemplate,
  pugTemplateCSS,
  ejsTemplate,
  ejsTemplateCSS,
  mustacheTemplate,
  mustacheTemplateCSS,
  nunjucksTemplate,
  nunjucksTemplateCSS,
};
