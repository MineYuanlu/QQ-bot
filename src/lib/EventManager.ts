import { Bot, EventHandler } from "ts-pbbot";
import type * as event from "ts-pbbot/lib/proto/onebot_event";
import { config } from "./config";
import { MaybePromise } from "./def/common";
import { isEnabled, isNeedHandle } from "./def/Plugin";
import { colors, Logger, prefix } from "./tools/logger";
import { randomStr } from "./tools/utils";

/**
 * 操作返回
 */
export const handlerAction = {
  /**允许事件继续传播, 默认值 */
  pass: new Object(),
  /**阻止事件继续传播 */
  prevent: new Object(),
} as const;

/**
 * 处理方法
 * @returns 操作返回
 */
export type HandlerFunc<T extends keyof EventHandlerDefine> = (
  ...arg: Parameters<EventHandlerDefine[T]>
) => MaybePromise<any>;

/** 一个处理器 */
export type Handler<T extends keyof EventHandlerDefine> = {
  /**处理函数 */
  func: HandlerFunc<T>;
  /**函数权重 */
  weight: number;
  /**插件名称 */
  name?: string;
  /**处理器唯一ID */
  key: string;
};
/**
 * 所有的事件
 * 事件类型 - 处理器列表
 */
const bus: {
  [T in keyof EventHandlerDefine]?: Handler<T>[];
} = {};
/**
 * 注册事件
 * @param name 插件名称
 * @param type 事件类型
 * @param func 事件方法
 * @param weight 事件权重
 * @returns 事件唯一ID
 */
export function register<T extends keyof EventHandlerDefine>(
  name: string,
  type: T,
  func: HandlerFunc<T>,
  weight: number = 0
): string {
  const key = `${name}-${type}-${randomStr()}`;
  let handlers = bus[type];
  if (!handlers) {
    handlers = bus[type] = [];
    EventHandler[type] = handler(type);
  }
  handlers.push({ func, weight, name, key });
  handlers.sort((a, b) => a.weight - b.weight);
  console.log(
    prefix.EVENT,
    Logger.pluginColor(name),
    "已注册事件:",
    colors.bold(type),
    "优先级:",
    colors.bold(weight.toString())
  );
  return key;
}

/**
 * 注册内部事件, 不可以由插件使用
 * @param type 事件类型
 * @param func 事件方法
 * @param weight 事件权重
 * @returns 事件唯一ID
 */
export function registerInternal<T extends keyof EventHandlerDefine>(
  type: T,
  func: HandlerFunc<T>,
  weight: number = 0
): string {
  const key = `${type}-${randomStr()}`;
  let handlers = bus[type];
  if (!handlers) {
    handlers = bus[type] = [];
    EventHandler[type] = handler(type);
  }
  handlers.push({ func, weight, key });
  handlers.sort((a, b) => a.weight - b.weight);

  console.log(
    prefix.EVENT,
    "已注册内部事件:",
    colors.bold(type),
    "优先级:",
    colors.bold(weight.toString())
  );
  return key;
}

/**
 * 获取事件实际处理
 * @param type 对应类型
 * @returns 事件实际处理器
 */
function handler(type: keyof EventHandlerDefine) {
  return async function (bot: Bot) {
    if (config.debug)
      console.debug(prefix.DEBUG, prefix.EVENT, "唤起事件:", colors.bold(type));
    const handlers: Handler<any>[] | undefined = bus[type];
    if (!handlers) return;
    for (const k in handlers) {
      const name = handlers[k].name;
      if (!name || isNeedHandle(name, bot.botId || undefined, undefined)) {
        if (config.debug)
          console.debug(
            prefix.DEBUG,
            prefix.EVENT,
            Logger.pluginColor(handlers[k].name),
            "调用事件:",
            colors.bold(type)
          );
        const resp = await handlers[k].func(...arguments);
        if (resp === handlerAction.prevent) return;
      }
    }
  };
}

/**
 * 事件重定义
 */
export type EventHandlerDefine = {
  handleConnect(bot: Bot): Promise<void>;
  handleDisconnect(bot: Bot): Promise<void>;
  handlePrivateMessage(
    bot: Bot,
    event: event.PrivateMessageEvent | undefined
  ): Promise<void>;
  handleGroupMessage(
    bot: Bot,
    event: event.GroupMessageEvent | undefined
  ): Promise<void>;
  handleGroupUploadNotice(
    bot: Bot,
    event: event.GroupUploadNoticeEvent | undefined
  ): Promise<void>;
  handleGroupAdminNotice(
    bot: Bot,
    event: event.GroupAdminNoticeEvent | undefined
  ): Promise<void>;
  handleGroupDecreaseNotice(
    bot: Bot,
    event: event.GroupDecreaseNoticeEvent | undefined
  ): Promise<void>;
  handleGroupIncreaseNotice(
    bot: Bot,
    event: event.GroupIncreaseNoticeEvent | undefined
  ): Promise<void>;
  handleGroupBanNotice(
    bot: Bot,
    event: event.GroupBanNoticeEvent | undefined
  ): Promise<void>;
  handleFriendAddNotice(
    bot: Bot,
    event: event.FriendAddNoticeEvent | undefined
  ): Promise<void>;
  handleGroupRecallNotice(
    bot: Bot,
    event: event.GroupRecallNoticeEvent | undefined
  ): Promise<void>;
  handleFriendRecallNotice(
    bot: Bot,
    event: event.FriendRecallNoticeEvent | undefined
  ): Promise<void>;
  handleFriendRequest(
    bot: Bot,
    event: event.FriendRequestEvent | undefined
  ): Promise<void>;
  handleGroupRequest(
    bot: Bot,
    event: event.GroupRequestEvent | undefined
  ): Promise<void>;
  handleChannelMessage(
    bot: Bot,
    event: event.ChannelMessageEvent | undefined
  ): Promise<void>;
};

type GetEvent<T> = T extends [Bot, infer S] ? S : never;
/**
 * 所有需要处理的事件类型
 */
export type EventTypes = Exclude<
  GetEvent<Parameters<EventHandlerDefine[keyof EventHandlerDefine]>>,
  undefined
>;
