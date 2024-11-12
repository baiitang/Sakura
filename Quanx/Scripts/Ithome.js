// 2023-02-11 22:30

const url = $request.url;
if (!$response.body) $done({});
let obj = JSON.parse($response.body);

// appList
if (
  url.includes("/json/listpage/news") ||
  url.includes("/json/newslist/news")
) {
  if (obj.newslist) {
    obj.newslist = obj.newslist.filter((n) => !n.aid);
  }
} else if (url.includes("/json/slide/index")) {
  // appSlide
  const newList = obj.filter((i) => !i.isad);
  obj.splice(0, obj.length);
  obj.push(...newList);
} else if (url.includes("/api/news/newslistpageget")) {
  // mobileWeb
  if (obj.Result) {
    obj.Result = obj.Result.filter((r) =>
      r.NewsTips.every((t) => t.TipName !== "广告")
    );
  }
} else if (
  url.includes("/api/news/index") ||
  url.includes("/api/topmenu/getfeeds")
) {
  // newAppFeed
  let list = obj.data.list;
  const newList = [];
  for (const item of list) {
    if (
      item.feedContent.smallTags &&
      item.feedContent.smallTags.some((s) => s.text === "广告")
    ) {
      continue;
    }
    if (item.feedContent.focusNewsData) {
      const newNewsData = item.feedContent.focusNewsData.filter((n) => !n.isAd);
      item.feedContent.focusNewsData = newNewsData;
    }
    newList.push(item);
  }
  obj.data.list = newList;
}

$done({ body: JSON.stringify(obj) });
