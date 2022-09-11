import _colors  from 'colors/safe';

export const colors = _colors;
export const prefix = {
  INFO: `[${colors.green('INFO')}]`,
  WARN: `[${colors.yellow('WARN')}]`,
  ERROR: `[${colors.red('ERROR')}]`,
  DEBUG: `[${colors.blue('DEBUG')}]`,
  EVENT: `[${colors.cyan('EVENT')}]`,
  CMD: `[${colors.cyan('CMD')}]`,
} as const;

/**
 * 简易日志记录器
 */
export class Logger {
  public readonly name: string;
  public constructor(name: string) {
    this.name = Logger.pluginColor(name);
  }
  public readonly info = (...out: any[]) => {
    console.info(prefix.INFO, this.name, ...out);
  };
  public readonly warn = (...out: any[]) => {
    console.warn(prefix.WARN, this.name, ...out);
  };
  public readonly error = (...out: any[]) => {
    console.error(prefix.ERROR, this.name, ...out);
  };
  public static pluginColor(name: string | undefined) {
    return name ? `[${colors.yellow(name)}]` : `[${colors.red('internal')}]`;
  }
  /**
   * 包装QQ数字
   * @param qq 数字
   * @param type `B`:Bot, `G`:Group, `U`:User
   */
  public static qqColor(qq: string | number | undefined, type: 'B' | 'G' | 'U' | undefined) {
    return qq ? `${colors.red(type || '')}[${(colors as any).brightYellow(qq.toString())}]` : '';
  }
  /**包装频道*/
  public static channelColor(channelId: string | number, guildId: string | number) {
    return `${colors.red('C')}[${(colors as any).brightYellow(channelId.toString())}/${(
      colors as any
    ).brightYellow(guildId.toString())}]`;
  }
}
