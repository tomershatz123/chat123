import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: strin;
      userEmail?: string;
    }
  }
}