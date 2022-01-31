"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beginFrame = /\n#(\d*)\n/;
exports.endFrame = /(.|\n)+(?=\n##)/;
exports.endFrameNoCapture = /\n##\n/;
exports.endHello = /]]>]]>/;
