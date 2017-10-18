"use strict";
/**
 * We use not solid archive. Folder represent the packed stream. It means, that if we have 117 files (regular files, not directories), we will have 117 folders.
 *
 * Each folder has 1-n packed streams. Even for non-solid archive. For our purposes indices in the packedStreams is not required, only count of packed streams is important.
 * Because packed streams for folder located in series (grouped).
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});
class Folder {
    findBindPairForInStream(index) {
        const bindPairs = this.bindPairs;
        for (let i = 0; i < bindPairs.length; i++) {
            if (bindPairs[i].inIndex === index) {
                return i;
            }
        }
        return -1;
    }
    // getOrderedCoders() {
    //   const l: Array<Coder> = []
    //   // more that 2^31 coders?
    //   let current = this.packedStreams[0]
    //   while (current !== -1) {
    //     l.push(this.coders[current])
    //     const pair = this.findBindPairForOutStream(current)
    //     current = pair !== -1 ? this.bindPairs[pair].inIndex : -1
    //   }
    //   return l
    // }
    findBindPairForOutStream(index) {
        for (let i = 0; i < this.bindPairs.length; i++) {
            if (this.bindPairs[i].outIndex === index) {
                return i;
            }
        }
        return -1;
    }
    // getUnpackSizeForCoder(coder: Coder) {
    //   if (this.coders != null) {
    //     for (let i = 0; i < this.coders.length; i++) {
    //       if (this.coders[i] === coder) {
    //         return this.unpackSizes[i]
    //       }
    //     }
    //   }
    //   return 0
    // }
    getUnpackSize() {
        if (this.totalOutputStreams === 0) {
            return 0;
        }
        for (let i = this.totalOutputStreams - 1; i >= 0; i--) {
            if (this.findBindPairForOutStream(i) < 0) {
                return this.unpackSizes[i];
            }
        }
        return 0;
    }
    getPackedSize() {
        if (this.totalInputStreams === 0) {
            return 0;
        }
        for (let i = this.totalInputStreams - 1; i >= 0; i--) {
            if (this.findBindPairForInStream(i) < 0) {
                return this.unpackSizes[i];
            }
        }
        return 0;
    }
}
exports.Folder = Folder;
class BindPair {
    toString() {
        return `BindPair binding input ${this.inIndex} to output ${this.outIndex}`;
    }
}
exports.BindPair = BindPair;
class Coder {}
exports.Coder = Coder; //# sourceMappingURL=Folder.js.map