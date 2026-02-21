import { Request, Response, NextFunction } from 'express';
interface HttpError extends Error {
    status?: number;
}
declare const errorHandler: (err: HttpError, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export { errorHandler, HttpError };
//# sourceMappingURL=error.d.ts.map