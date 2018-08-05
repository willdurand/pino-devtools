const PinoDevTools = (console, WebSocket, window) => {
  const { hostname, port } = window.location;
  const wsPort = parseInt(port, 10) + 1;

  const socket = new WebSocket(`ws://${hostname}:${wsPort}`);

  const logger = {
    10: console.trace,
    20: console.debug,
    30: console.info,
    40: console.warn,
    50: console.error,
    60: console.error,
  };

  socket.addEventListener('message', ({ data }) => {
    try {
      const {
        hostname,
        level,
        msg,
        name,
        pid,
        time,
        v,
        ...otherFields
      } = JSON.parse(data);

      const message = `[${name}] ${msg || '<no message>'}`;

      if (Object.keys(otherFields).length) {
        logger[level](message, otherFields);
      } else {
        logger[level](message);
      }
    } catch (err) {
      console.debug('[pino-devtools] received non-JSON message:', data);
    }
  });
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PinoDevTools;
} else {
  PinoDevTools(console, WebSocket, window);
}
