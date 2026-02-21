import basicAuth from 'basic-auth';
import { Request, Response, NextFunction } from 'express';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = basicAuth(req);
  
  const expectedUsername = process.env.DASHBOARD_USERNAME;
  const expectedPassword = process.env.DASHBOARD_PASSWORD;
  
  if (!user || !expectedUsername || !expectedPassword) {
    res.set('WWW-Authenticate', 'Basic realm="Dashboard"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (user.name !== expectedUsername || user.pass !== expectedPassword) {
    res.set('WWW-Authenticate', 'Basic realm="Dashboard"');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  next();
};

export { authMiddleware };