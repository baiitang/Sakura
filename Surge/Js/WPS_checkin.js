const $ = new ToolClient();
$.getScript`https://cdn.jsdelivr.net/npm/fabric@latest/dist/fabric.min.js`;

const {
  AK,
  SK,
  MAX_RETRIES = 5,
} = $.parseArgument();


const captureRequest = () => {
  const parse = (delimiter) => (str) =>
    Object.fromEntries(str.split(delimiter).map((v) => v.split("=")));

  const { userid } = parse("&")($request?.body ?? "");

  const { wps_sids } = parse(/;\s+?/g)($request.headers?.cookie ?? "");

  const isInfo = userid && wps_sids;

  isInfo && $.writeJson({ userid, cookie: { wps_sids } }, "WPS_info");

  const message = isInfo ? "抓包成功,请关闭抓包模块" : "抓包失败,请检查请求内容";

  $.msg(...message.split(","));
};

const delay = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const executeTasksWithReduce = async (tasks, seconds) =>
  tasks.reduce(async (acc, task) => {
    const results = await acc;
    results.push(await task());
    await delay(seconds);
    return results;
  }, Promise.resolve([]));

const splitImage = async ({ imgReq, dir, parts, contrast }) => {
  const base64Image = await $.fetch(imgReq).toBase64Image("web");

  const img = await new Promise((resolve) => fabric.Image.fromURL(base64Image, resolve));

  const contrastFilter = new fabric.Image.filters.Contrast({
    contrast,
  });
  img.filters.push(contrastFilter);
  img.applyFilters();

  const partWidth = img.width / (dir === "X" ? parts : 1);
  const partHeight = img.height / (dir === "Y" ? parts : 1);

  return Array.from({ length: parts }, (_, i) => {
    const splitCanvas = new fabric.StaticCanvas(null);

    splitCanvas.setWidth(dir === "X" ? partWidth : img.width);
    splitCanvas.setHeight(dir === "Y" ? partHeight : img.height);

    const part = new fabric.Image(img.getElement(), {
      left: dir === "X" ? -i * partWidth : 0,
      top: dir === "Y" ? -i * partHeight : 0,
    });

    splitCanvas.add(part);

    return splitCanvas
      .toDataURL({
        format: "png",
        quality: 1.0,
      })
      .split(",")[1];
  });
};

const baidu = async (image, cb) => {
  const parse = (obj) =>
    Object.entries(obj)
      .map((v) => v.join("="))
      .join("&");

  const getAccessToken = () =>
    $.fetch
      .post(
        `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${AK}&client_secret=${SK}`
      )
      .toJson((resp) => resp.access_token);

  const op = {
    method: "post",
    url:
      "https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting?access_token=" +
      (await getAccessToken()),

    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },

    body: parse({
      image: encodeURIComponent(image),
      recognize_granularity: "big",
      detect_direction: "true",
      probability: "true",
      detect_alteration: "true",
      language_type: "CHN_ENG",
    }),
  };

  const { error_msg, ...body } = await $.fetch(op).toJson();
  if (error_msg) throw new Error(`百度api调用失败,错误信息: ${error_msg}`);
  return cb(body);
};

class Wps {
  constructor(options) {
    this.options = options;
    this.nickname = options.nickname;
    this.userid = options.userid;
    this.headers = {
      cookie: "wps_sid=" + options.cookie.wps_sids,
      referer: "https://wps.cn",
      origin: "https://vip.wps.cn",
    };
  }

  //获取验证码图片
  async getCaptchaImage(args) {
    const imgReq = {
      url: `https://personal-act.wps.cn/vas_risk_system/v1/captcha/image?service_id=wps_clock&t=${+new Date()}&request_id=wps_clock_${
        this.userid
      }`,
      headers: this.headers,
      "binary-mode": true,
    };

    return splitImage({ imgReq, ...args });
  }

  //签到
  async checkin(c) {
    const op = {
      method: c ? "post" : "get",
      url: "https://personal-act.wps.cn/wps_clock/v2",
      headers: this.headers,
      body: `double=0&v=6.11.0.8885&c=${c}&version=6.11.0.8885`,
    };
    return $.fetch(op).toJson();
  }

  //获取奖励信息
  async rewardInfo(message) {
    const userName = this.nickname ?? (await this.getUserName());
    const { cost, total } = await this.getBalance();
    const { reward, todayReward } = await this.formatRewardInfo();

    reward.unshift("📝签到日志:");
    reward.unshift(`🎉${message}, ${todayReward}`);
    reward.unshift(`👤用户信息: ${userName}`);

    reward.push(`🏦已使用额度: ${cost / 3600}小时(${Math.floor(cost / 86400)})天`);
    reward.push(`💰剩余额度: ${total / 3600}小时(${Math.floor(total / 86400)})天`);

    $.log("\n" + reward.join("\n"));
    $.msg(reward.shift(), reward.shift(), reward.join("\n"));
  }

  //格式化奖励信息
  async formatRewardInfo() {
    const { list } = await this.checkin().then((body) => body.data);
    let todayReward;

    const reward = list.map(({ status, times, selected, ext }) => {
      const { hour, name } = JSON.parse(ext)[0];

      selected && status && (todayReward = `获得${hour}小时会员`);

      return `⌚️第${times}天🎁奖励${hour}小时会员🎊${status ? "已领取" : "未领取"}`;
    });

    return { reward, todayReward };
  }

  //获取用户名
  async getUserName() {
    const op = {
      url: "https://account.wps.cn/p/auth/check",
      headers: this.headers,
    };

    const { nickname } = await $.fetch.post(op).toJson();

    $.writeJson({ ...this.options, nickname }, "WPS_info");
    return nickname;
  }

  //获取余额
  async getBalance() {
    const op = {
      url: "https://vipapi.wps.cn/wps_clock/v2/user",
      headers: this.headers,
    };
    return $.fetch(op).toJson((body) => body.data);
  }
}

//主逻辑
const main = async () => {
  const WPS_info = $.readJson("WPS_info");
  if (!WPS_info) throw new Error("未获取CK, 请先抓包");
  const wps = new Wps(WPS_info);

  const checkinAttempt = async (retryCount = 0) => {
    const coordinate = ["38,43", "105,50", "174,30", "245,50", "314,34"];
    const captchaImages = await wps.getCaptchaImage({
      dir: "X", //X:横向,Y:纵向
      parts: 5, //拆分成几份
      contrast: 0.5, //对比度
    });

    //创建任务列表
    const tasks = captchaImages.map(
      (image, i) => async () =>
        baidu(image, (body) => (body?.direction === 2 ? coordinate[i] : null))
    );

    //获取坐标
    const dataArray = await executeTasksWithReduce(tasks, 0.6);

    const position = encodeURIComponent(
      encodeURIComponent(dataArray.filter(Boolean).join("|"))
    );

    //签到
    const { msg, result } = await wps.checkin(position);

    if (result === "ok" || msg === "ClockAgent") {
      return await wps.rewardInfo(msg ? "今日已签到" : "今日签到成功");
    } else if (retryCount >= MAX_RETRIES - 1) {
      return $.notifyAndLog({
        info: true,
        msg: true,
        message: [`签到失败, 已重试最大限制 ${MAX_RETRIES} 次`],
      });
    }

    $.info(`签到失败, 重试次数: ${retryCount + 1}`);
    return checkinAttempt(retryCount + 1);
  };

  await checkinAttempt();
};

//入口
!(async () => {
  await $.runScript();
  if (this.$request) {
    captureRequest();
  } else {
    await main();
  }
})()
  .catch($.error)
  .finally($done);


function ToolClient(t,e){class MyPromise extends Promise{static withResolvers(){let t,e;const s=new this(((s,r)=>{t=s,e=r}));return{promise:s,resolve:t,reject:e}}toJson(t=(t=>t)){return this.then((({body:e})=>t(JSON.parse(e))))}toStr(t=(t=>t)){return this.then((({body:e})=>t('string'==typeof e?e:JSON.stringify(e,null,2))))}toBinaryString(t){return t.reduce(((t,e)=>t+String.fromCharCode(e)),'')}toBase64Image(t){return this.then((({body:e,bodyBytes:s,headers:r})=>{const i=t?`data:${r['Content-Type']};base64,`:'',o=s?this.toBinaryString(new Uint8Array(s)):this.toBinaryString(e);return i+btoa(o)}))}}class Fetch{static setResponse(t){return this.#t=t.bind(this),this}static#t=({error:t,body:e,bodyBytes:s,status:r,headers:i})=>{if(t||r<200||r>399)throw new Error(t??e);return{bodyBytes:s,body:e,status:r,headers:i}};static#e={Qx(t,e){$task.fetch(t).then((({bodyBytes:t,body:s,statusCode:r,headers:i})=>e({bodyBytes:t,body:s,status:r,headers:i})),(t=>e({error:t})))},Surge(t,e){$httpClient[t.method](t,((t,{status:s,headers:r},i)=>e({error:t,body:i,status:s,headers:r})))},get Loon(){return this.Surge},get Stash(){return this.Surge},get Shadowrocket(){return this.Surge}};constructor(t){return this.$env=t.$env,new Proxy(((...t)=>this.#s(this.#r('get',...t))),{get:(t,e)=>(...t)=>this.#s(this.#r(e,...t))})}#s(t){const{promise:e,resolve:s}=MyPromise.withResolvers(),r=t.timeout*(this.$env('Surge')?1:1e3);Fetch.#e[this.$env()]({...t,timeout:r},s);const i=setTimeout((()=>s({error:'请求超时'})),1e3*t.timeout);return e.then(Fetch.#t).catch((async e=>{if(t.maxRetries<=1)throw e;return await new Promise((e=>setTimeout(e,1e3*t.retryDelay))),t.maxRetries--,this.#s(t)})).finally((()=>clearTimeout(i)))}#r(t,e,s=0,r=1){'string'==typeof e&&(e={url:e});const{$auto:i=!0,...o}=e,n=this.#i(e.headers);return{method:t,headers:n,timeout:4,maxRetries:s,retryDelay:r,'auto-redirect':i,opts:{redirection:i},...o}}#i(t={}){return Object.fromEntries(Object.entries(t).map((([t,e])=>[t.toLowerCase(),e])))}}class Notify{static signatures={AAAA:'video/mp4',JVBERi0:'application/pdf',R0lGODdh:'image/gif',R0lGODlh:'image/gif',iVBORw0KGgo:'image/png',Qk02U:'image/bmp','/9j/':'image/jpg'};constructor(t,e,s){
return this.msgName=t,this.msgKey=e,this.fetch=s.fetch,this.defaultMsg=s.defaultMsg,this.msg.bind(this)}msg(t='',e='',s='',r={}){'string'==typeof r&&(r={$open:r});const{$open:i,$media:o='',$copy:n='',...a}=r,h=t+'\n'+e+'\n'+s,g={Bark:()=>this.fetch(`https://api.day.app/${this.msgKey}/${h}?url=${i}&icon=${o}`),PushDeer:()=>this.fetch(`https://api2.pushdeer.com/message/push?pushkey=${this.msgKey}&text=${h}`)},{mime:c,base64:l}=this.#o(o);return g[this.msgName]?.()??this.defaultMsg(`${t}`,`${e}`,`${s}`,{action:n?'clipboard':'open-url','open-url':i,openUrl:i,url:i,mediaUrl:o,'media-url':o,'media-base64':l,'media-base64-mime':c,text:n,'update-pasteboard':n,clipboard:n,...a})}#o(t){if(!t||t.startsWith('http'))return{};if(t.startsWith('data:')){const[,e,,s]=t.split(/:|;|,/g);return{mime:e,base64:s}}const e=Notify.signatures[Object.keys(Notify.signatures).find((e=>t.startsWith(e)))]?.[1];return e?{mime:e,base64:t}:{}}}class ScriptManager{static#n=[];static#a={dayjs:'https://cdn.jsdelivr.net/npm/dayjs/dayjs.min.js',md5:'https://cdn.jsdelivr.net/npm/crypto-js/md5.min.js',crypto:'https://cdn.jsdelivr.net/npm/crypto-js/crypto-js.min.js',base64:'https://cdn.jsdelivr.net/npm/js-base64@3.7.5/base64.min.js'};constructor(t){this.tool=t}getScript(t){const e=ScriptManager.#a[t]??t,s=this.getCacheName(e),r=this.tool.read(s),i=(r?Promise.resolve(r):this.tool.fetch(e)).then((t=>{const e=t.body??t;globalThis.eval(e),r||this.tool.write(e,s)})).catch((t=>{throw`${e}: ${t}`}));ScriptManager.#n.push(i)}getCacheName(t){return t.replace(/(\.min|\.js$)/g,'').split('/').at(-1)}async runScripts(){await Promise.all(ScriptManager.#n)}}class Log{static#h={debug:0,info:1,warn:2,error:3,log:4};static#g='\n';static#c=[];static#l=Log.#u('info');static#u(t){if(!Log.#h.hasOwnProperty(t))throw new Error(`无效的日志级别-${t}`);return Log.#h[t]}static setLogLevel(t){Log.#l=Log.#u(t)}static logWithLevel(t,e){if(Log.#l>Log.#u(t))return;const s='log'===t?'':`[${t}]`;console.log(`${s} ${Log.#p(e)}`)}static#p(t){return t.length&&Log.#c.push(...t),t.map(Log.#m).join(Log.#g)}static#m(t){return t&&'object'==typeof t?t.stack?`${t.name}: ${t.message}\n${t.stack}`:JSON.stringify(t,null,4):String(t)}}return ToolClient=class{constructor(t,e){this.#d(),this.fetch=new Fetch(this),this.msg=this.getMsg(t,e),this.script=new ScriptManager(this)}$env(t){const e={'$environment.surge-build':'Surge',$task:'Qx',$loon:'Loon','$environment.stash-version':'Stash',$rocket:'Shadowrocket'};for(const[s,r]of Object.entries(e))if(s.split('.').reduce(((t,e)=>t?.[e]),globalThis))return this.$env=t=>t?t===r:r,this.$env(t);throw new Error('环境不支持')}#d(){const t=this.$env('Qx');this.read=t?$prefs.valueForKey:$persistentStore.read,this.write=t?$prefs.setValueForKey:$persistentStore.write,this.defaultMsg=t?$notify:$notification.post}toStr(t){return JSON.stringify(t,null,2)}toJson(t){return JSON.parse(t)}readJson(t){return this.toJson(this.read(t))}writeJson(t,e){return this.write(JSON.stringify(t),e)}setResponse(t){return Fetch.setResponse(t),this.fetch}httpApi(t,e='GET',s=null){const{promise:r,resolve:i}=MyPromise.withResolvers();return $httpAPI(e,t,s,i),r}getMsg(t,e){return new Notify(t,e,this)}getScript([t]){this.script.getScript(t)}async runScript(){await this.script.runScripts()}setLogLevel(t){Log.setLogLevel(t)}debug(...t){Log.logWithLevel('debug',t)}info(...t){Log.logWithLevel('info',t)}warn(...t){Log.logWithLevel('warn',t)}error(...t){Log.logWithLevel('error',t)}log(...t){Log.logWithLevel('log',t)}notifyAndLog({message:t=[],...e}){Object.keys(e).forEach((s=>{const r=e[s];r&&this[s](...t)}))}parseArgument(){return globalThis.$argument?Object.fromEntries($argument.split('&').map((t=>t.split('=')))):{}}},new ToolClient(t,e)}