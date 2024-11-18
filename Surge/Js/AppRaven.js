var body = $response.body;

body = body.replace(/"premium":false/g, '"premium":true');
body = body.replace(/"hasInAppPurchases":false/g,'"hasInAppPurchases":true');
body = body.replace(/"youOwn":false/g,
'"youOwn":true');
body = body.replace(/"arcade":false/g,
'"arcade":true');

body = body.replace(/"preorder":false/g,
'"preorder":true');

$done({ body });