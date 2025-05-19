// #!source=https://raw.githubusercontent.com/ALLG999/newcloud/refs/heads/master/FQXSHY.JS

// vip_status.js
let body = $response.body;
body = body.replace(/"is_vip":false/g, '"is_vip":true');
body = body.replace(/"vip_type":\d+/g, '"vip_type":1');
body = body.replace(/"expire_time":"\d+"/g, '"expire_time":"4071916800"');
$done({ body });
