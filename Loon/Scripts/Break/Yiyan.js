// 2024-10-01 17:05

const url = $request.url;
if (!$response) $done({});
if (!$response.body) $done({});
let obj = JSON.parse($response.body);

if (url.includes("/checkpro") || url.includes("/getvipproduct")) {
  // 本地会员
  if (obj?.u.viptype) {
    obj.u.viptype = "3";
  }
  if (obj?.viptype) {
    obj.viptype = "3";
  }
} else if (url.includes("/getalltextcard") || url.includes("/getuserinfoandbooklist")) {
  // 开通会员的横幅
  if (obj?.banner?.length > 0) {
    delete obj.banner;
  }
  if (obj?.user?.viptype) {
    obj.user.viptype = "3";
  }
}

$done({ body: JSON.stringify(obj) });
