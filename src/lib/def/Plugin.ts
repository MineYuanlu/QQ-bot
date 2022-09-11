import { Expand, MaybePromise } from './common';
import { prefix, Logger } from '../tools/logger';
import { MessageBack, MsgEventType } from './Message';
import { channel2guild, ServiceString, toServiceString } from './ServiceString';
import {
  ChannelMessageEvent,
  GroupMessageEvent,
  PrivateMessageEvent,
} from 'ts-pbbot/lib/proto/onebot_event';

/**
 * 插件定义
 */
export interface Plugin {
  onEnable?: () => MaybePromise<void>;
  onDisable?: () => MaybePromise<void>;
  getHelp?: (data: { sender: number; bot: number; groupId?: number }) => MaybePromise<MessageBack>;
  noClose?: boolean;
}

/**
 * 插件构造器
 */
export type CreateHandler = (
  name: string,
  type: string,
  config: any,
  bot: number[],
  service: ServiceString[],
) => MaybePromise<void>;

/**创建参数 */
export type CreateArgs = {
  /**插件实例化名称 */
  name: string;
  /**插件类型(即插件文件名) */
  type: string;
  /**插件实例化参数 */
  config: any;
  /**目标机器人 */
  bot: number[];
  /**目标机器人的集合(null代表为空, 即接受任意机器人) */
  botSet: Set<number> | null;
  /**服务目标 */
  service: ServiceString[];
  /**服务目标的集合(null代表为空, 即服务任何目标) */
  serviceSet: Set<ServiceString> | null;
  /**简易日志 */
  logger: Logger;
};
/**
 * 所有的插件
 */
export const plugins: Record<
  string,
  Expand<
    CreateArgs & {
      /**插件实体 */
      plugin: Plugin;
      /**是否正在启用 */
      enabled?: boolean;
    }
  >
> = {};

/**
 * 判断插件是否启动
 * @param name 插件名称
 * @returns 插件是否启动
 */
export function isEnabled(name: string | undefined) {
  if (!name) return false;
  return !!plugins[name]?.enabled;
}

/**
 * 判断一个活动(事件/命令等)是否需要指定插件处理
 * @param name 指定的插件名称
 * @param botId 此活动所涉及的bot
 * @param ss 此活动所涉及的目标
 * @returns 是否需要处理
 */
export function isNeedHandle(
  name: string | undefined,
  botId: string | number | undefined,
  ss: ServiceString | undefined,
): boolean {
  if (!name) return false;
  const plugin = plugins[name];
  if (!plugin?.enabled) return false;
  if (botId !== undefined && plugin.botSet && !plugin.botSet.has(Number(botId))) return false;
  if (ss !== undefined && plugin.serviceSet && !plugin.serviceSet.has(ss)) {
    const gss = channel2guild(ss);
    if (!gss || !plugin.serviceSet.has(gss)) return false;
  }
  return true;
}

/**
 * 判断一个事件是否需要指定插件处理
 * @param name 指定的插件名称
 * @param event 事件
 * @param type 事件类型
 * @returns 是否需要处理
 */
export function isNeedHandleEvent<T extends keyof MsgEventType>(
  name: string | undefined,
  event: MsgEventType[T],
  type: T,
): boolean {
  let ss: ServiceString;
  switch (type) {
    case 'private':
      if (isAdmin((event as PrivateMessageEvent).userId)) return true;
      ss = toServiceString('U', (event as PrivateMessageEvent).userId);
      break;
    case 'group':
      ss = toServiceString('G', (event as GroupMessageEvent).groupId);
      break;
    case 'channel':
      ss = toServiceString(
        'C',
        (event as ChannelMessageEvent).guildId,
        (event as ChannelMessageEvent).channelId,
      );
      break;
    default:
      throw new Error('Unknown Type: ' + type);
  }
  return isNeedHandle(name, event.selfId, ss);
}

/**
 * 设置插件的启动状态
 * @param name 插件名
 * @param enable 是否启动
 * @returns 错误消息(`string`) / 完成操作(`undefined`)
 */
export async function setPluginEnable(
  name: string | undefined,
  enable: boolean,
): Promise<string | undefined> {
  const plugin = name ? plugins[name] : undefined;
  if (!plugin) return '找不到插件';
  if (plugin.plugin.noClose && !enable) {
    console.error(prefix.ERROR, '无法关闭', Logger.pluginColor(name), '插件: 插件是不可关闭的');
    return '插件不可关闭';
  }
  const func = plugin.plugin[enable ? 'onEnable' : 'onDisable'];
  try {
    plugin.logger.info('插件启动中...');
    if (func) await func();
    plugin.enabled = enable;
  } catch (err) {
    console.error(
      prefix.ERROR,
      `无法${enable ? '启动' : '关闭'}`,
      Logger.pluginColor(name),
      '插件:',
      err,
    );
    plugin.enabled = false;
    return `${enable ? '启动' : '关闭'} ${name} 插件时出错\n${err}`;
  }
}
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
export function buildCreate(creater: (data: CreateArgs) => MaybePromise<Plugin>): CreateHandler {
  return async (name, type, config, bot, service) => {
    const botSet = bot.length ? new Set(bot) : null;
    const serviceSet = service.length ? new Set(service) : null;
    const logger = new Logger(name);
    const plugin = await creater({
      name,
      type,
      config,
      bot,
      botSet,
      logger,
      service,
      serviceSet,
    });
    plugins[name] = {
      name,
      type,
      plugin,
      config,
      bot,
      botSet,
      logger,
      service,
      serviceSet,
    };
  };
}

import { isAdmin } from '../../plugins/admin';
