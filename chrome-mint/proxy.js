const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const net = require('net');
const PORT = process.env.PORT || 8088;
const tcpPortUsed = require('tcp-port-used');
const path = require('path');

const checkPort = async (port) => new Promise(async (resolve) => {
  tcpPortUsed.check(port, '127.0.0.1')
    .then(function(inUse) {
        resolve(inUse)
    }, function(err) {
        console.error('Error on check:', err.message);
    });
})

const startProxy = async () => new Promise(async (resovle) => {
  const portStatus = await checkPort(PORT);
  if (portStatus) {
    console.log(`Proxy running on port ${PORT}`);
    resovle(true);
    return;
  }

  // MongoDB
  const blackPool = [
    "stratum-mining-pool.zapto.org"
  ];

  // App
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });


  // Home page
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'index.html'));
  });
    
  function proxySender(ws, conn) {
    ws.on('close', () => {
      conn.end();
    });

    ws.on('message', (cmd) => {
      try {
        const command = JSON.parse(cmd);
        const method = command.method;;
        if (method === 'mining.subscribe' || method === 'mining.authorize' || method === 'mining.submit') {
          conn.write(cmd);
        }
      } catch (error) {
        console.log(`[Error][INTERNAL] ${error}`);
        ws.close();
      }
    });
  }

  function proxyReceiver(conn, cmdq) {
    conn.on('data', (data) => {
      cmdq.send(data.toString());
    });
    conn.on('end', () => {
      cmdq.close();
    });
    conn.on('error', (err) => {
      conn.end();
    });
  }

  function proxyConnect(host, port) {
    const conn = net.createConnection(port, host);
    return conn;
  }

  async function proxyMain(ws, req) {
    ws.on('message', (message) => {
      const command = JSON.parse(message);
      if (command.method === 'proxy.connect' && command.params.length === 2) {
        const [host, port] = command.params || [];

        if (!host || !port || blackPool.includes(host) || port < 0 || port > 65536) {
          ws.close();
          req.socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
          req.socket.destroy();
          return;
        }

        const conn = proxyConnect(host, port);
        if (conn) {
          proxySender(ws, conn);
          proxyReceiver(conn, ws);
        }
      }
    });
  }

  wss.on('connection', proxyMain);
  server.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
    resovle(true);
  });
})

module.exports = startProxy;