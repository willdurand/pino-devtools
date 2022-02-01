const fs = require('fs');
const http = require('http');
const path = require('path');
const { parse: parseURL } = require('url');

const WebSocket = require('ws');
const openUrl = require('open');
const pump = require('pump');
const split = require('split2');
const through = require('through2');

const { parseOptions } = require('./utils');
const indexHTML = fs.readFileSync(path.join(__dirname, 'index.html'));
const clientJS = fs.readFileSync(path.join(__dirname, 'client.js'));

const MODE_BUFFER = 'buffer';
const MODE_WEBSOCKET = 'websocket';
const MODES = [MODE_BUFFER, MODE_WEBSOCKET];

const DEFAULT_OPTIONS = {
  host: '127.0.0.1',
  mode: MODE_WEBSOCKET,
  open: true,
  port: '3010',
  tee: false,
};

let BUFFER = {
  logs: [],
  prefix: 'server',
};

const createWebSocketTransformFunction = ({ options, wsServer }) => {
  return (record, enc, cb) => {
    if (options.tee) {
      console.log(record);
    }

    wsServer.broadcast(record);
    cb();
  };
};

const webSocketHandler = (req, res) => {
  let pathName = null;
  try {
    pathName = parseURL(req.url).pathname;
  } catch (e) {}

  if (pathName === '/client.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript' });
    return res.end(clientJS);
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(indexHTML);
};

const createBufferTransformFunction = ({ options }) => {
  return (record, enc, cb) => {
    if (options.tee) {
      console.log(record);
    }

    BUFFER = {
      ...BUFFER,
      logs: BUFFER.logs.concat(record),
    };
    cb();
  };
};

const bufferHandler = (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
  };

  let pathName = null;
  try {
    pathName = parseURL(req.url).pathname;
  } catch (e) {}

  if (pathName !== '/server-logs.json') {
    res.writeHead(404, headers);
    return res.end();
  }

  const json = JSON.stringify(BUFFER);
  headers['Content-Type'] = 'application/json';

  // reset buffer once returned.
  BUFFER = {
    ...BUFFER,
    logs: [],
  };

  res.writeHead(200, headers);
  return res.end(json);
};

module.exports = () => {
  const options = parseOptions(process.argv.slice(2), DEFAULT_OPTIONS);
  const { host, mode, port, open } = options;

  if (!MODES.includes(mode)) {
    console.error(`Invalid mode: "${mode}", choices: ${MODES.join(', ')}`);
    process.exit(1);
  }

  let server;
  if (mode === MODE_BUFFER) {
    server = http.createServer(bufferHandler);
  } else {
    server = http.createServer(webSocketHandler);
  }

  const httpPort = parseInt(port, 10) || parseInt(DEFAULT_OPTIONS.port, 10);

  server.listen(
    {
      port: httpPort,
      host,
    },
    (err) => {
      let transport;
      if (mode === MODE_WEBSOCKET) {
        const url = `http://${host}:${httpPort}/`;
        const wsPort = httpPort + 1;
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

        transport = createWebSocketTransformFunction({ options, wsServer });

        if (open) {
          openUrl(url);
        } else {
          console.log(`Open your browser at: ${url}`);
        }
      } else {
        transport = createBufferTransformFunction({ options });
      }

      pump(process.stdin, split(), through.obj(transport));
    }
  );
};
