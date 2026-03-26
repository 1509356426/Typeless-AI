"use strict";
// 共享类型定义
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCChannel = void 0;
// IPC 通道枚举
var IPCChannel;
(function (IPCChannel) {
    IPCChannel["GET_VERSION"] = "get-version";
    IPCChannel["GET_APP_INFO"] = "get-app-info";
    IPCChannel["SEND_MESSAGE"] = "send-message";
    IPCChannel["RECEIVE_MESSAGE"] = "receive-message";
    IPCChannel["OPEN_EXTERNAL"] = "open-external";
    IPCChannel["SHOW_ERROR"] = "show-error";
    IPCChannel["SHOW_INFO"] = "show-info";
})(IPCChannel || (exports.IPCChannel = IPCChannel = {}));
