/*
[rewrite_local]
^https:\/\/tiku\.fenbi\.com\/iphone\/(shenlun|xingce|sqgj)\/banners\/v2?.* url script-response-body https://raw.githubusercontent.com/githubacct001/QuantumultX/secret/Rewrite/Fenbi/fbgk.js

[mitm]
hostname = tiku.fenbi.com
*/

let obj = JSON.parse($response.body);

obj = {
  banners: {
    total: 0,
    datas: [{}]
  },
  bannerStringVO: {
    redirectType: null,
    content: "练习",
    endTime: 9223372036854775807,
    url: null
  }
};

$done({ body: JSON.stringify(obj) });
