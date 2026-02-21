"use strict";
/**
 * WebSocket Module - Real-time communication for ClawPanel
 *
 * This module provides WebSocket functionality for real-time
 * dashboard updates. It shares the HTTPS server with Express.
 *
 * @module websocket
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shutdownWebSocketServer = exports.createWebSocketServer = exports.verifyClientSync = exports.verifyClient = exports.connectionManager = exports.ConnectionManager = void 0;
// Connection Management
var manager_1 = require("./manager");
Object.defineProperty(exports, "ConnectionManager", { enumerable: true, get: function () { return manager_1.ConnectionManager; } });
Object.defineProperty(exports, "connectionManager", { enumerable: true, get: function () { return manager_1.connectionManager; } });
// Authentication
var auth_1 = require("./auth");
Object.defineProperty(exports, "verifyClient", { enumerable: true, get: function () { return auth_1.verifyClient; } });
Object.defineProperty(exports, "verifyClientSync", { enumerable: true, get: function () { return auth_1.verifyClientSync; } });
// Server
var server_1 = require("./server");
Object.defineProperty(exports, "createWebSocketServer", { enumerable: true, get: function () { return server_1.createWebSocketServer; } });
Object.defineProperty(exports, "shutdownWebSocketServer", { enumerable: true, get: function () { return server_1.shutdownWebSocketServer; } });
//# sourceMappingURL=index.js.map