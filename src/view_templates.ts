let pugTemplate = `html
head
    title Hi :)
body
    h1= message`;

let ejsTemplate = `<html>
  <body>
    <%= message %>
  </body>
</html>`;

let mustacheTemplate = `<html>
  <body>
    <img src="{{ message }}">
  </body>
</html>`;

let nunjucksTemplate = `<html>
  <body>
    <h1>{{ message }}</h1>
  </body>
</html>`;

export { pugTemplate, ejsTemplate, mustacheTemplate, nunjucksTemplate };
