let cssTemplate = `body {
  background-color: #ffe4c4;
  text-align: center;
  font-family: Arial, Helvetica, sans-serif;
}
`;

let scssTemplate = `$my_color: rgb(10, 161, 133);

body {
  text-align: center;
  color: $my_color;
  font-family: Arial, Helvetica, sans-serif;
  background-color: bisque;
}
`;

let stylusTemplate = `my-color = red
body
  color my-color
  text-align center
`;

export { cssTemplate, scssTemplate, stylusTemplate };
