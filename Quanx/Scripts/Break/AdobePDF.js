/*
脚本作者：Marol62926
引用地址：https://raw.githubusercontent.com/Marol62926/MarScrpt/main/adobe.js
脚本功能：解锁Adobe Scan, Adobe Acrobat

[rewrite_local]
# Adobe解锁订阅 //createpdf.acrobat.com
^https?:\/\/createpdf\.acrobat\.com\/createpdf\/api\/users\/me\/subscriptions  url script-response-body https://gitlab.com/RuCu6/QuanX/-/raw/main/Scripts/Crack/adobePdf.js

[mitm]
hostname = createpdf.acrobat.com
*/

var body = $response.body;
var obj = JSON.parse(body);

obj = {
  subscriptions: [
    {
      subscription_name: "AcrobatPlus",
      subscription_level: "Plus",
      subscription_state: "ACTIVE",
      sub_ref: "",
      biz_source: "CCC",
      billing_term: null
    },
    {
      subscription_name: "ESign",
      subscription_level: "Basic",
      subscription_state: "ACTIVE",
      sub_ref: "",
      biz_source: "CCC",
      billing_term: null
    },
    {
      subscription_name: "PDFPack",
      subscription_level: "Plus",
      subscription_state: "ACTIVE",
      sub_ref: "",
      biz_source: "",
      billing_term: null
    },
    {
      subscription_name: "CreatePDF",
      subscription_level: "Basic",
      subscription_state: "ACTIVE",
      sub_ref: "",
      biz_source: "CCC",
      billing_term: null
    }
  ]
};

body = JSON.stringify(obj);
$done({ body });
