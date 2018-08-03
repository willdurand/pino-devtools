# pino-devtools

A transport for viewing logs in your favorite browser devtools!

<p align="center"><img src="./docs/screenshot-1.png"></p>

## Usage

Given an application `your-app.js` that logs via [pino](https://www.npmjs.com/package/pino), you would use `pino-devtools` like so:

```
$ node your-app.js | pino-devtools
```

`pino-devtools` automatically opens a page in your default browser (unless `--open false` is supplied). Open the devtools and you will see the logs coming from your application into the console tab.

### Options

- `--host 127.0.0.1`: the host for the HTTP and web socket servers
- `--port 3010`: the HTTP server port
- `--open`: open the page in your default browser (default behavior)

Note: the web socket port is `port + 1`.

## License

pino-devtools is released under the Mozilla Public License Version 2.0. See the bundled [LICENSE](./LICENSE.txt) file for details.
