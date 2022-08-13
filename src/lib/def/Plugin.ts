import { MaybePromise } from "./common";
import { prefix, Logger } from "../tools/logger";
import { MessageBack } from "./Message";

/**
 * 插件定义
 */
export interface Plugin {
  onEnable?: () => MaybePromise<void>;
  onDisable?: () => MaybePromise<void>;
  getHelp?: (data: {
    sender: number;
    bot: number;
    groupId?: number;
  }) => MaybePromise<MessageBack>;
  noClose?: boolean;
}

/**
 * 插件构造器
 */
export type CreateHandler = (
  name: string,
  type: string,
  config: any,
  bot: number[]
) => MaybePromise<void>;

/**
 * 所有的插件
 */
export const plugins: Record<
  string,
  {
    /**插件类型 */
    type: string;
    /**插件实体 */
    plugin: Plugin;
    /**配置文件 */
    config: any;
    /**使用的bot(留空则代表任意) */
    bot: number[];
    /**`bot`变量的set */
    botSet: Set<number> | null;
    /**是否正在启用 */
    enabled?: boolean;
  }
> = {};

/**
 * 判断插件是否启动
 * @param name 插件名称
 * @returns 插件是否启动
 */
export const isEnabled = (
  name: string | undefined,
  botId?: string | number
) => {
  if (!name) return false;
  const plugin = plugins[name];
  if (!plugin?.enabled) return false;
  if (botId === undefined || !plugin.botSet || !plugin.botSet.size) return true;
  return plugin.botSet.has(Number(botId));
};

/**
 * 设置插件的启动状态
 * @param name 插件名
 * @param enable 是否启动
 * @returns 错误消息(`string`) / 完成操作(`undefined`)
 */
export const setPluginEnable = async (
  name: string | undefined,
  enable: boolean
): Promise<string | undefined> => {
  const plugin = name ? plugins[name] : undefined;
  if (!plugin) return "找不到插件";
  if (plugin.plugin.noClose && !enable) {
    console.error(
      prefix.ERROR,
      "无法关闭",
      Logger.pluginColor(name),
      "插件: 插件是不可关闭的"
    );
    return "插件不可关闭";
  }
  const func = plugin.plugin[enable ? "onEnable" : "onDisable"];
  try {
    if (func) await func();
    plugin.enabled = enable;
  } catch (err) {
    console.error(
      prefix.ERROR,
      `无法${enable ? "启动" : "关闭"}`,
      Logger.pluginColor(name),
      "插件:",
      err
    );
    plugin.enabled = false;
    return `${enable ? "启动" : "关闭"} ${name} 插件时出错\n${err}`;
  }
};

/**
 * 构建插件创造器
 *
 * 每个插件都需要使用此函数返回值作为模块导出
 *
 * 例如:
 * ```ts
 * export const create = buildCreate(({ name, botSet, logger }) => {
 *  return {}
 * }
 * ```
 * 更多使用方法请参考内置插件
 *
 * @param creater 插件创造器
 * @returns 构建结果
 */
export function buildCreate(
  creater: (data: {
    name: string;
    type: string;
    config: any;
    bot: number[];
    botSet: Set<number> | null;
    logger: Logger;
  }) => MaybePromise<Plugin>
): CreateHandler {
  return async (name, type, config, bot) => {
    const botSet = bot.length ? new Set(bot) : null;
    const plugin = await creater({
      name,
      type,
      config,
      bot,
      botSet,
      logger: new Logger(name),
    });
    plugins[name] = { type, plugin, config, bot, botSet };
  };
}
