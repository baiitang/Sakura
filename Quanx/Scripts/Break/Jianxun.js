// 2023-01-15 10:01

if (!$response.body) $done({});
const url = $request.url;
let obj = JSON.parse($response.body);

// 简讯
if (url.includes("/api/v1/user/info")) {
  let obj = JSON.parse(body);
  obj.data.is_vip = true;
  obj.data.vip_expire_time = "2040-01-01 23:59:59";
  body = JSON.stringify(obj);
}

$done({ body });
