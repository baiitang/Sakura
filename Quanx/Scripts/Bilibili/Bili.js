// 2023-04-01 08:55

const url = $request.url;
let obj = JSON.parse($response.body);

if (!$response.body) {
  $done({});
} else {
  // 强制设置的皮肤
  if (url.includes("/x/resource/show/skin")) {
    if (obj.data?.common_equip) {
      delete obj.data.common_equip;
    }
  } else if (url.includes("/x/resource/show/tab/v2")) {
    // 标签页
    if (obj.data.tab) {
      obj.data.tab = obj.data.tab.filter(
        (item) =>
          item.name === "推荐" ||
          item.name === "热门" ||
          item.name === "动画" ||
          item.name === "影视"
      );
      fixPos(obj.data.tab);
    }
    if (obj.data.top) {
      obj.data.top = [
        {
          id: 176,
          icon: "http://i0.hdslb.com/bfs/archive/d43047538e72c9ed8fd8e4e34415fbe3a4f632cb.png",
          tab_id: "消息Top",
          name: "消息",
          uri: "bilibili://link/im_home",
          pos: 1
        }
      ];
    }
    if (obj.data.bottom) {
      obj.data.bottom = obj.data.bottom.filter(
        (item) =>
          !(
            item.name === "发布" ||
            item.name === "会员购" ||
            item.name === "節目"
          )
      );
      fixPos(obj.data.bottom);
    }
  } else if (url.includes("/x/resource/top/activity")) {
    // 右上角活动入口
    obj = {
      code: -404,
      message: "啥都木有",
      ttl: 1,
      data: null
    };
  } else if (url.includes("/x/v2/account/mine")) {
    // 我的页面
    // 标准版：
    // 396离线缓存 397历史记录 398我的收藏 399稍后再看 171个性装扮 172我的钱包 407联系客服 410设置
    // 港澳台：
    // 534离线缓存 8历史记录 4我的收藏 428稍后再看
    // 352离线缓存 1历史记录 405我的收藏 402个性装扮 404我的钱包 544创作中心
    // 概念版：
    // 425离线缓存 426历史记录 427我的收藏 428稍后再看 171创作中心 430我的钱包 431联系客服 432设置
    // 国际版：
    // 494离线缓存 495历史记录 496我的收藏 497稍后再看 741我的钱包 742稿件管理 500联系客服 501设置
    // 622为会员购中心 425开始为概念版id
    const itemList = new Set([
      396, 397, 398, 399, 407, 410, 494, 495, 496, 497, 500, 501
    ]);
    if (obj.data?.sections_v2) {
      obj.data.sections_v2.forEach((element, index) => {
        let items = element.items.filter((e) => itemList.has(e.id));
        obj.data.sections_v2[index].button = {};
        obj.data.sections_v2[index].tip_icon = "";
        obj.data.sections_v2[index].be_up_title = "";
        obj.data.sections_v2[index].tip_title = "";
        if (
          obj.data.sections_v2[index].title === "推荐服务" ||
          obj.data.sections_v2[index].title === "更多服务" ||
          obj.data.sections_v2[index].title === "创作中心"
        ) {
          obj.data.sections_v2[index].title = "";
          obj.data.sections_v2[index].type = "";
        }

        obj.data.sections_v2[index].items = items;
        obj.data.vip_section_v2 = "";
        obj.data.vip_section = "";
        obj.data.live_tip = "";
        obj.data.answer = "";
        // 开启本地会员标识
        if (obj.data.vip.status === 1) {
          return false;
        } else {
          obj.data.vip_type = 2;
          obj.data.vip.type = 2;
          obj.data.vip.status = 1;
          obj.data.vip.vip_pay_type = 1;
          obj.data.vip.due_date = 2208960000; // Unix 时间戳 2040-01-01 00:00:00
          obj.data.vip.role = 3;
        }
      });
    }
  } else if (url.includes("/x/v2/account/myinfo")) {
    // 会员清晰度
    if (obj.data.vip.status === 1) {
      $done({});
    } else {
      obj.data.vip.type = 2;
      obj.data.vip.status = 1;
      obj.data.vip.vip_pay_type = 1;
      obj.data.vip.due_date = 2208960000; // Unix 时间戳 2040-01-01 00:00:00
      obj.data.vip.role = 3;
    }
  } else if (url.includes("/x/v2/feed/index")) {
    // 推荐广告
    if (obj.data?.items) {
      obj.data.items = obj.data.items.filter((i) => {
        const { card_type: cardType, card_goto: cardGoto } = i;
        if (cardType && cardGoto) {
          if (cardType === "banner_v8" && cardGoto === "banner") {
            // 去除判断条件 首页横版内容全部去掉
            // if (i.banner_item) {
            // for (const v of i.banner_item) {
            //   if (v.type) {
            //     if (v.type === "ad") return false;
            //   }
            // }
            // return false;
            // }
            return false;
            // ad_player大视频广告 ad_web_gif大gif广告 ad_web_s普通小广告 ad_av创作推广广告 ad_inline_3d 上方大的视频3d广告
          } else if (
            cardType === "cm_v2" &&
            [
              "ad_web_s",
              "ad_av",
              "ad_web_gif",
              "ad_player",
              "ad_inline_3d"
            ].includes(cardGoto)
          ) {
            return false;
            // 游戏广告
          } else if (cardType === "small_cover_v10" && cardGoto === "game") {
            return false;
            // 创作推广-大视频广告
          } else if (
            cardType === "cm_double_v9" &&
            cardGoto === "ad_inline_av"
          ) {
            return false;
          }
        }
        return true;
      });
    }
  } else if (url.includes("/x/v2/search/square")) {
    // 热搜广告
    if (obj.data) {
      obj.data = {
        type: "history",
        title: "搜索历史",
        search_hotword_revision: 2
      };
    }
  } else if (url.includes("/x/v2/splash")) {
    // 开屏广告
    const item = ["account", "event_list", "preload", "show"];
    if (obj.data) {
      item.forEach((i) => {
        delete obj.data[i];
      });
    }
  } else if (
    url.includes("/pgc/page/bangumi") ||
    url.includes("/pgc/page/cinema/tab")
  ) {
    // 观影页广告
    if (obj.result?.modules) {
      obj.result.modules.forEach((i) => {
        if (i.style.startsWith("banner")) {
          i.items = i.items.filter((ii) => ii.link.includes("play"));
        } else if (i.style.startsWith("function")) {
          i.items = i.items.filter((ii) => ii.blink.startsWith("bilibili"));
        } else if ([241, 1283, 1284, 1441].includes(i.module_id)) {
          i.items = [];
        } else if (i.style.startsWith("tip")) {
          i.items = [];
        }
      });
    }
  } else if (url.includes("/xlive/app-room/v1/index/getInfoByRoom")) {
    // 直播广告
    if (obj.data?.activity_banner_info) {
      obj.data.activity_banner_info = null;
    }
    if (obj.data?.shopping_info) {
      obj.data.shopping_info = {
        is_show: 0
      };
    }
    if (obj.data?.new_tab_info?.outer_list?.length > 0) {
      obj.data.new_tab_info.outer_list =
        obj.data.new_tab_info.outer_list.filter((i) => i.biz_id !== 33);
    }
  }
  $done({ body: JSON.stringify(obj) });
}

// 修复pos
function fixPos(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i].pos = i + 1;
  }
}
