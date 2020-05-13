// copied from https://github.com/ghaiklor/icecast-parser

const http = require('http');
const https = require('https');
const EventEmitter = require('events');
import { StreamReader } from './stream-reader'

const DEFAULT_OPTIONS = {
  userAgent: 'Mozilla',
  keepListen: false,
  autoUpdate: true,
  errorInterval: 10 * 60,
  emptyInterval: 5 * 60,
  metadataInterval: 5
};

export class RadioParser extends EventEmitter {
  constructor (options) {
    super();

    if (typeof options === 'string') {
      this.setConfig({ url: options });
    } else {
      this.setConfig(options);
    }

    this.queueRequest();
  }

  _onRequestResponse (response) {
    const icyMetaInt = response.headers['icy-metaint'];

    if (icyMetaInt) {
      const reader = new StreamReader(icyMetaInt);

      reader.on('metadata', metadata => {
        this._destroyResponse(response);
        this._queueNextRequest(this.getConfig('metadataInterval'));
        this.emit('metadata', metadata);
      });

      response.pipe(reader);
      this.emit('stream', reader);
    } else {
      this._destroyResponse(response);
      this._queueNextRequest(this.getConfig('emptyInterval'));
      this.emit('empty');
    }

    return this;
  }

  _onRequestError (error) {
    this._queueNextRequest(this.getConfig('errorInterval'));
    this.emit('error', error);
    return this;
  }

  _onSocketEnd () {
    if (this.getConfig('keepListen')) this.emit('end');
    return this;
  }

  _makeRequest () {
    const request = (this.getConfig('url').indexOf('https://') === 0) ? https.request(this.getConfig('url')) : http.request(this.getConfig('url'));

    request.setHeader('Icy-MetaData', '1');
    request.setHeader('User-Agent', this.getConfig('userAgent'));
    request.once('socket', function (socket) {
      socket.once('end', this._onSocketEnd.bind(this));
    }.bind(this));
    request.once('response', this._onRequestResponse.bind(this));
    request.once('error', this._onRequestError.bind(this));
    request.end();

    return this;
  }

  _destroyResponse (response) {
    if (!this.getConfig('keepListen')) response.destroy();
    return this;
  }

  _queueNextRequest (timeout) {
    if (this.getConfig('autoUpdate') && !this.getConfig('keepListen')) this.queueRequest(timeout);
    return this;
  }

  queueRequest (timeout = 0) {
    setTimeout(this._makeRequest.bind(this), timeout * 1000);
    return this;
  }

  getConfig (key) {
    return key ? this._config[key] : this._config;
  }

  setConfig (config) {
    if (!this._config) {
      const defaultConfig = Object.assign({}, DEFAULT_OPTIONS);
      this._config = Object.assign(defaultConfig, config);
    } else {
      this._config = Object.assign(this._config, config);
    }

    return this;
  }
}
