import { Request, Response, NextFunction } from 'express';

interface HttpError extends Error {
  status?: number;
}

const errorHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
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

export { errorHandler, HttpError };