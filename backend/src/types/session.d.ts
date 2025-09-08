import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
      studentId?: string;
      department?: string;
    };
  }
}