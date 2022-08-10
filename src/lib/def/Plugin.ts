import exp = require("constants");
import { MaybePromise } from "./common";
import { Logger } from "./logger";

/**
 * 插件定义
 */
export interface Plugin {
  onEnable: () => MaybePromise<void>;
  onDisable: () => MaybePromise<void>;
}

/**
 * 插件构造器
 */
export type CreateHandler = (
  name: string,
  config: any,
  bot: (number | string)[]
) => MaybePromise<void>;

/**
 * 所有的插件
 */
const plugins: Record<
  string,
  {
    plugin: Plugin;
    config: any;
    bot: (number | string)[];
    enabled?: boolean;
  }
> = {};

/**
 * 判断插件是否启动
 * @param name 插件名称
 * @returns 插件是否启动
 */
export const isEnabled = (name: string | undefined) => {
  if (!name) return false;
  return !!plugins[name]?.enabled;
};

export const setPluginEnable = async (
  name: string | undefined,
  enable: boolean
) => {
  const plugin = name ? plugins[name] : undefined;
  if (!plugin) return null;
  const func = plugin.plugin[enable ? "onEnable" : "onDisable"];
  try {
    await func();
    plugin.enabled = enable;
  } catch (err) {
    console.error(
      `[ERROR] 无法${enable ? "启动" : "关闭"} [${name}] 插件: `,
      err
    );
    plugin.enabled = false;
  }
};

/**
 * 构建插件创造器
 * @param creater 插件创造器
 * @returns 构建结果
 */
export function buildCreate(
  creater: (data: {
    name: string;
    config: any;
    bot: (number | string)[];
    logger: Logger;
  }) => MaybePromise<Plugin>
): CreateHandler {
  return async (name, config, bot) => {
    const plugin = await creater({
      name,
      config,
      bot,
      logger: new Logger(name),
    });
    plugins[name] = { plugin, config, bot };
  };
}
