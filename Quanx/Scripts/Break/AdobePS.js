/*
脚本作者：Marol62926
引用地址：https://raw.githubusercontent.com/Marol62926/MarScrpt/main/adobe.js
脚本功能：解锁Adobe Photoshop, Adobe Illustrator, Adobe Lightroom, Premiere Rush, Adobe Express, Spark Page, Spark Video, Adobe Fresco

[rewrite_local]
# Adobe解锁订阅 //lcs-mobile-cops.adobe.io
^https?:\/\/lcs-mobile-cops\.adobe\.io\/mobile_profile\/nul\/v2 url script-response-body https://gitlab.com/RuCu6/QuanX/-/raw/main/Scripts/Crack/adobePs.js

[mitm]
hostname = lcs-mobile-cops.adobe.io
*/

var body = $response.body;
var obj = JSON.parse(body);

obj.mobileProfile.profileStatus = "PROFILE_AVAILABLE";
obj.mobileProfile.legacyProfile = {
  licenseId: "",
  licenseType: 3,
  licenseVersion: "1.0",
  effectiveEndTimestamp: 1872675992000,
  graceTime: 8553600000,
  licensedFeatures: [],
  enigmaData: {
    productId: 598,
    serialKey: "",
    clearSerialKey: "",
    locale: "ALL",
    associatedLocales: "ALL",
    platform: 0,
    isk: 5984027,
    customerId: 0,
    deliveryMethod: 3,
    pc: true,
    rb: true
  }
};
obj.mobileProfile.relationshipProfile = [
  {
    profileGenerationTimestamp: 1651745145759,
    licenseId: "",
    licenseExpiryTimestamp: 1872675992000,
    appEntitlementStatus: "SUBSCRIPTION",
    activationType: "NAMED_USER",
    billingStatus: "NORMAL",
    usedForLegacyProfile: true,
    licenseExpiryWarningControl: { warningStartTimestamp: 1872675992000, warningInterval: 0 }
  }
];

body = JSON.stringify(obj);
$done({ body });
