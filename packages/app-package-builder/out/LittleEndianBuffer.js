"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.LittleEndianBuffer = undefined;

var _int64Buffer;

function _load_int64Buffer() {
    return _int64Buffer = require("int64-buffer");
}

class LittleEndianBuffer {
    constructor(buffer) {
        let index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        this.buffer = buffer;
        this.index = index;
    }
    /**
     * Creates a new byte buffer whose content is a shared subsequence of this buffer's content.
     */
    slice() {
        return this.buffer.slice(this.index);
    }
    readByte() {
        return this.buffer.readInt8(this.index++);
    }
    readUnsignedByte() {
        return this.buffer.readUInt8(this.index++);
    }
    readLong() {
        const value = new (_int64Buffer || _load_int64Buffer()).Int64LE(this.buffer, this.index).toNumber();
        this.index += 8;
        return value;
    }
    readInt() {
        const value = this.buffer.readInt32LE(this.index);
        this.index += 4;
        return value;
    }
    readUnsignedInt() {
        const value = this.buffer.readUInt32LE(this.index);
        this.index += 4;
        return value;
    }
    get(dst) {
        this.buffer.copy(dst, 0, this.index);
        this.index += dst.length;
    }
    skip(count) {
        this.index += count;
    }
    remaining() {
        return this.buffer.length - this.index;
    }
}
exports.LittleEndianBuffer = LittleEndianBuffer; //# sourceMappingURL=LittleEndianBuffer.js.map