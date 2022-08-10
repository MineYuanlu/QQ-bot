import { Bot, EventHandler } from "ts-pbbot";
import type * as event from "ts-pbbot/lib/proto/onebot_event";
import { isEnabled } from "./def/Plugin";
import { randomStr } from "./tools/utils";

export type Handler<T extends keyof EventHandlerDefine> = {
  func: EventHandlerDefine[T];
  weight: number;
  name?: string;
  key: string;
};
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
  func: EventHandlerDefine[T],
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
  console.log(`[EVENT] [${name}] 已注册事件: ${type}, 优先级: ${weight}`);
  return key;
}

function handler(type: keyof EventHandlerDefine) {
  return async function () {
    const handlers: Handler<any>[] | undefined = bus[type];
    if (!handlers) return;
    for (const k in handlers) {
      if (isEnabled(handlers[k].name)) await handlers[k].func(...arguments);
    }
  };
}

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
