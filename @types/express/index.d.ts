// Indicate the file is a module to avoid TypeScript error.
export {};

declare global{
  namespace Express {
    interface Request {
      userId: string
    }
  }
}
