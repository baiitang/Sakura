// 2023-03-31 17:20

const url = $request.url;
const header = $request.headers;
let ua = header["User-Agent"] || header["user-agent"];

if (url.includes("/amdc/mobileDispatch")) {
  if (ua.includes("AMapiPhone") || ua.includes("Cainiao")) {
    $done({ status: "HTTP/1.1 404 Not Found" });
    return;
  }
}

$done({});
