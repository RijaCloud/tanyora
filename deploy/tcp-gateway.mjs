import net from "node:net";

const listenPort = Number(process.env.LISTEN_PORT || 3237);
const targetHost = process.env.TARGET_HOST || "base-web";
const targetPort = Number(process.env.TARGET_PORT || 3000);

net.createServer((client) => {
  const upstream = net.connect(targetPort, targetHost);
  client.pipe(upstream).pipe(client);
  client.on("error", () => upstream.destroy());
  upstream.on("error", () => client.destroy());
}).listen(listenPort, "0.0.0.0");
