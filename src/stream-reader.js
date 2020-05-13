// copied from https://github.com/ghaiklor/icecast-parser

const { Transform } = require('stream')

const INIT_STATE = 1;
const BUFFERING_STATE = 2;
const PASSTHROUGH_STATE = 3;

const METADATA_BLOCK_SIZE = 16;
const METADATA_REGEX = /(\w+)=['"](.+?)['"];/g;

const _parseMetadata = metadata => {
  const data = Buffer.isBuffer(metadata) ? metadata.toString('utf8') : metadata || '';
  const parts = [...data.replace(/\0*$/, '').matchAll(METADATA_REGEX)];

  return parts.reduce((metadata, item) => (metadata[item[1]] = String(item[2])) && metadata, {});
};

const _trampoline = function (fn) {
  return function () {
    let result = fn.apply(this, arguments);
    while (typeof result === 'function') result = result();
    return result;
  };
};

const _processData = (stream, chunk, done) => {
  stream._bytesLeft -= chunk.length;

  if (stream._currentState === BUFFERING_STATE) {
    stream._buffers.push(chunk);
    stream._buffersLength += chunk.length;
  } else if (stream._currentState === PASSTHROUGH_STATE) {
    stream.push(chunk);
  }

  if (stream._bytesLeft === 0) {
    const cb = stream._callback;

    if (cb && stream._currentState === BUFFERING_STATE && stream._buffers.length > 1) {
      chunk = Buffer.concat(stream._buffers, stream._buffersLength);
    } else if (stream._currentState !== BUFFERING_STATE) {
      chunk = null;
    }

    stream._currentState = INIT_STATE;
    stream._callback = null;
    stream._buffers.splice(0);
    stream._buffersLength = 0;

    cb.call(stream, chunk);
  }

  return done;
};

const _onData = _trampoline((stream, chunk, done) => {
  if (chunk.length <= stream._bytesLeft) {
    return () => _processData(stream, chunk, done);
  } else {
    return () => {
      const buffer = chunk.slice(0, stream._bytesLeft);

      return _processData(stream, buffer, error => {
        if (error) return done(error);
        if (chunk.length > buffer.length) {
          return () => _onData(stream, chunk.slice(buffer.length), done);
        }
      });
    };
  }
});

export class StreamReader extends Transform {
  constructor (icyMetaInt) {
    super();

    // How many bytes left to read
    this._bytesLeft = 0;

    // Current state of reader, what the reader should do with received bytes
    this._currentState = INIT_STATE;

    // Callback for the next chunk
    this._callback = null;

    // Array of collected Buffers
    this._buffers = [];

    // How many bytes already read
    this._buffersLength = 0;

    // icy-metaint number from radio response
    this._icyMetaInt = +icyMetaInt;

    this._passthrough(this._icyMetaInt, this._onMetaSectionStart);
  }

  _bytes (length, cb) {
    this._bytesLeft = length;
    this._currentState = BUFFERING_STATE;
    this._callback = cb;
    return this;
  }

  _passthrough (length, cb) {
    this._bytesLeft = length;
    this._currentState = PASSTHROUGH_STATE;
    this._callback = cb;
    return this;
  }

  _transform (chunk, encoding, done) {
    _onData(this, chunk, done);
  }

  _onMetaSectionStart () {
    this._bytes(1, this._onMetaSectionLengthByte);
  }

  _onMetaSectionLengthByte (chunk) {
    const length = chunk[0] * METADATA_BLOCK_SIZE;

    if (length > 0) {
      this._bytes(length, this._onMetaData);
    } else {
      this._passthrough(this._icyMetaInt, this._onMetaSectionStart);
    }
  }

  _onMetaData (chunk) {
    this.emit('metadata', _parseMetadata(chunk));
    this._passthrough(this._icyMetaInt, this._onMetaSectionStart);
  }
}
