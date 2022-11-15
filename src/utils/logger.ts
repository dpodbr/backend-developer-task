export enum LoggerLevel {
  Info = '[info]',
  Error = '[error]',
  Warning = '[warning]'
}

export class Logger {
  public log(level: LoggerLevel, text: string, ...params: any): void {
    console.log(level, new Date().toISOString(), text, ...params);
  }

  public info(text: string, ...params: any): void {
    this.log(LoggerLevel.Info, text, ...params);
  }

  public warning(text: string, ...params: any): void {
    this.log(LoggerLevel.Warning, text, ...params);
  }

  public error(text: string, ...params: any): void {
    this.log(LoggerLevel.Error, text, ...params);
  }
}

export const logger: Logger = new Logger();
