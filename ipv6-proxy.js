const net = require("net");
const server = net.createServer((socket) => {
  const client = net.createConnection({host: "127.0.0.1", port: 3000});
  socket.pipe(client);
  client.pipe(socket);
  socket.on("error", () => client.destroy());
  client.on("error", () => socket.destroy());
});
server.listen(3000, "::1", () => console.log("IPv6 proxy on [::1]:3000 -> 127.0.0.1:3000"));
