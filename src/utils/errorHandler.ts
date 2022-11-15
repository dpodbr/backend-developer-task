import { Response } from 'express';
import { APIError } from 'src/utils/apiError';
import { logger, LoggerLevel } from 'src/utils/logger';

export function handleError(tag: string, error: any, res: Response): void {
  let code: number = 500;
  let message: string = 'Internal server error.';
  let loggerLevel: LoggerLevel = LoggerLevel.Error;

  if (error instanceof APIError) {
    code = error.code;
    message = error.message;
    if (code !== 500) {
      loggerLevel = LoggerLevel.Warning;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  res.status(code).json({ message });
  logger.log(loggerLevel, `${tag}: `, error);
}
