import { ClientInfo, VerifyClientCallback } from './types';
/**
 * verifyClient - WebSocket client verification callback
 *
 * Validates WebSocket upgrade requests using Basic Auth.
 * This is called before the WebSocket connection is established.
 *
 * @param info - Client info containing origin and request
 * @param cb - Callback function to accept (true) or reject (false) the connection
 */
export declare function verifyClient(info: ClientInfo, cb: VerifyClientCallback): void;
export declare function verifyClientSync(info: ClientInfo): boolean;
//# sourceMappingURL=auth.d.ts.map