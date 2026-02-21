"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    // Log the error
    console.error(err);
    // Default error status
    const status = err.status || 500;
    // Handle specific error types
    switch (status) {
        case 401:
            return res.status(401).json({ error: 'Unauthorized' });
        case 404:
            return res.status(404).json({ error: 'Not Found' });
        default:
            return res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.js.map