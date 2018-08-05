const PinoDevTools = require('../src/client');

describe(__filename, () => {
  class WebSocketMock {
    constructor(url) {
      WebSocketMock.url = url;
      WebSocketMock.events = {};
    }

    addEventListener(event, callback) {
      WebSocketMock.events[event] = callback;
    }

    static getRegisteredEvents() {
      return Object.keys(WebSocketMock.events);
    }

    static callEventListener(event, payload) {
      WebSocketMock.events[event](payload);
    }

    static reset() {
      WebSocketMock.url = null;
      WebSocketMock.events = {};
    }
  }

  const createFakeWindow = ({ hostname = 'localhost', port = 3000 } = {}) => {
    return {
      ...window,
      location: {
        ...window.location,
        hostname,
        port,
      },
    };
  };

  const startPinoDevTools = ({
    _console = console,
    _WebSocket = WebSocketMock,
    _window = createFakeWindow(),
  } = {}) => {
    PinoDevTools(_console, _WebSocket, _window);
  };

  const createMessage = ({ msg = null, level = 10, ...others } = {}) => {
    return {
      data: JSON.stringify({
        hostname: 'server-001',
        level,
        msg,
        name: 'test',
        pid: 1234,
        time: Date.now(),
        v: 1,
        ...others,
      }),
    };
  };

  beforeEach(() => {
    WebSocketMock.reset();
  });

  it('initalizes a web socket', () => {
    const hostname = 'example.org';
    const port = 1234;
    const _window = createFakeWindow({ hostname, port });

    startPinoDevTools({ _window });

    expect(WebSocketMock.url).toEqual(`ws://${hostname}:${port + 1}`);
  });

  it('registers an event listener', () => {
    expect(WebSocketMock.getRegisteredEvents()).toHaveLength(0);

    startPinoDevTools();

    expect(WebSocketMock.getRegisteredEvents()).toHaveLength(1);
    expect(WebSocketMock.getRegisteredEvents()).toContain('message');
  });

  it.each([
    [10, 'trace'],
    [20, 'debug'],
    [30, 'info'],
    [40, 'warn'],
    [50, 'error'],
    [60, 'error'],
  ])('binds the pino level %d to "console.%s"', (level, consoleMethod) => {
    const message = createMessage({ name: 'app', level });
    const _console = {
      [consoleMethod]: jest.fn(),
    };

    startPinoDevTools({ _console });
    WebSocketMock.callEventListener('message', message);

    expect(_console[consoleMethod]).toHaveBeenCalledWith('[app] <no message>');
  });

  it('passes an object with extra fields as second argument', () => {
    const extraFields = { foo: 123, bar: 'abcdef' };
    const message = createMessage({ ...extraFields });
    const _console = {
      trace: jest.fn(),
    };

    startPinoDevTools({ _console });
    WebSocketMock.callEventListener('message', message);

    expect(_console.trace).toHaveBeenCalledWith(
      '[test] <no message>',
      extraFields
    );
  });

  it('logs errors with console.debug', () => {
    const message = { data: 'invalid data' };
    const _console = {
      debug: jest.fn(),
    };

    startPinoDevTools({ _console });
    WebSocketMock.callEventListener('message', message);

    expect(_console.debug).toHaveBeenCalledWith(
      '[pino-devtools] received non-JSON message:',
      message.data
    );
  });

  it('indicates when there is no message', () => {
    const message = createMessage({ msg: undefined });
    const _console = {
      trace: jest.fn(),
    };

    startPinoDevTools({ _console });
    WebSocketMock.callEventListener('message', message);

    expect(_console.trace).toHaveBeenCalledWith('[test] <no message>');
  });
});
