(function() {
  const writeLog = ({ _console, data, prefix = null }) => {
    const logger = {
      10: _console.trace,
      20: _console.debug,
      30: _console.info,
      40: _console.warn,
      50: _console.error,
      60: _console.error,
    };

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

      const logName = prefix ? `${prefix}|${name}` : name;
      const message = `[${logName}] ${msg || '<no message>'}`;

      if (Object.keys(otherFields).length) {
        logger[level](message, otherFields);
      } else {
        logger[level](message);
      }
    } catch (err) {
      _console.debug('[pino-devtools] could not write log:', data);
    }
  };

  const readWebSocketLogs = ({
    _WebSocket = WebSocket,
    _console = console,
    _window = window,
  } = {}) => {
    const { hostname, port } = _window.location;
    const wsPort = parseInt(port, 10) + 1;

    const socket = new _WebSocket(`ws://${hostname}:${wsPort}`);

    socket.addEventListener('message', ({ data }) => {
      writeLog({ data, _console });
    });
  };

  const fetchBufferedLogs = ({
    host = '127.0.0.1',
    port = 3010,
    _console = console,
  } = {}) => {
    if (!host) {
      throw new Error('You must pass `host` to `fetchBufferedLogs()`.');
    }

    if (!port) {
      throw new Error('You must pass `port` to `fetchBufferedLogs()`.');
    }

    return fetch(`http://${host}:${port}/server-logs.json`)
      .then((response) => response.json())
      .then(({ logs, prefix }) => {
        logs.forEach((data) => {
          writeLog({ _console, data, prefix });
        });
      })
      .catch((err) => {
        _console.debug('[pino-devtools] error while fetching the logs:', {
          error: err.toString(),
        });
      });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      fetchBufferedLogs,
      readWebSocketLogs,
    };
  } else {
    readWebSocketLogs();
  }
})();
