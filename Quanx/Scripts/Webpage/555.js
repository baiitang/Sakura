/*
2022-05-28
*/

var body = $response.body.replace(
  /<head>/,
  '<head><link rel="stylesheet" href="https://gitlab.com/RuCu6/QuanX/-/raw/main/Css/555.css" type="text/css">'
);
$done({ body });
