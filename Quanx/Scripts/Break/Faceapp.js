/*
FaceApp解锁vip

^https:\/\/api\.faceapp\.io(.*)\/api\/v.*\/auth\/user\/credentials url script-response-body https://raw.githubusercontent.com/ackakakaka/QuantumultX/master/faceapp.js

hostname = api.faceapp.io
*/

var obj = $response.body;

obj = {
  user: null,
  user_token:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzZXNzaW9uX2lkIjoiIiwiZGV2aWNlX2lkIjoiNzE2MDdDMzEtRDE2My00NjZFLTkzRjctNEEzMkU4RERCRTNEIiwiZXhwIjoxNTc2MjMzMDUxLCJzdWJzY3JpcHRpb24iOnsic3Vic2NyaXB0aW9uX2V4cCI6MTU3NjIzMzA1MSwiY3VzdG9tZXJfaWQiOiJGMi9mS2R5cWgwRVdXK3N4V21BaEZBRG9iTHdzVXVQZnBOZlUzRjlzK0djPSIsInByb2R1Y3RfaWQiOiIxIn19.1NT8jfiajbakI1s_nohsic5r47DKxqeua4RvqH7Zp0MXlWVWEgQzK6LvCxcxxzk0buzbn4iJxYh7x2XhLos0KA",
  user_token_lifetime: 86400,
  subscription_apple: {
    subscription_exp: 1639391451,
    product_id: "1"
  },
  subscription_google: null
};

$done({ body });
