#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const path = require('path');

const WebSocket = require('ws');
const opn = require('opn');
const pump = require('pump');
const split = require('split2');
const through = require('through2');

const { parseOptions } = require('./src/utils');
const indexHTML = fs.readFileSync(path.join(__dirname, 'src', 'index.html'));

const DEFAULT_OPTIONS = {
  host: '127.0.0.1',
  open: true,
  port: '3010',
};

const createTransformFunction = ({ options, wsServer }) => {
  return (record, enc, cb) => {
    wsServer.broadcast(record);
    cb();
  };
};

if (require.main === module) {
  const options = parseOptions(process.argv.slice(2), DEFAULT_OPTIONS);
  const { host, port, open } = options;

  const httpPort = parseInt(port, 10) || parseInt(DEFAULT_OPTIONS.port, 10);
  const wsPort = httpPort + 1;
  const url = `http://${host}:${httpPort}/`;

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexHTML);
  });

  server.listen(
    {
      port: httpPort,
      host,
    },
    (err) => {
      const wsServer = new WebSocket.Server({
        host: host,
        port: wsPort,
      });

      wsServer.broadcast = (data) => {
        wsServer.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        });
      };

      const devtoolsTransport = through.obj(
        createTransformFunction({ options, wsServer })
      );

      pump(process.stdin, split(), devtoolsTransport);

      if (open) {
        opn(url);
      } else {
        console.log(`Open your browser at: ${url}`);
      }
    }
  );
}
