// 2024-04-20 11:45

const url = $request.url;
let header = $request.headers;

if (url.includes("/api/v1/movies/") && url.includes("/play?")) {
  header.authorization =
    "Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MzE4OTE0NSwidXNlcm5hbWUiOiJjaHhtMTAyNSJ9.9biip2hb60jXeakBMbnP-5QiLyycLj9s7dpHyXNUp7E"
  $done({ headers: header });
} else {
  $done({});
}
