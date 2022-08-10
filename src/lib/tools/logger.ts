/**
 * 简易日志记录器
 */
export class Logger {
  public readonly name: string;
  public constructor(name: string) {
    this.name = `[${name}]`;
  }
  public readonly info = (...out: any[]) => {
    console.info("[INFO]", this.name, ...out);
  };
  public readonly error = (...out: any[]) => {
    console.error("[ERR]", this.name, ...out);
  };
}
