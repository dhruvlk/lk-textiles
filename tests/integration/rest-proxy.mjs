// Maps Supabase's /rest/v1/* paths onto a bare PostgREST server (test only).
import http from "node:http";
const [, , listenPort = "54321", targetPort = "3999"] = process.argv;
http
  .createServer((req, res) => {
    const path = req.url.replace(/^\/rest\/v1/, "") || "/";
    const upstream = http.request(
      { host: "127.0.0.1", port: Number(targetPort), path, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${targetPort}` } },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      }
    );
    upstream.on("error", (e) => {
      res.writeHead(502);
      res.end(String(e));
    });
    req.pipe(upstream);
  })
  .listen(Number(listenPort), "127.0.0.1");
