import { type } from "os";
import { Bot, Msg } from "ts-pbbot";
import { Message } from "ts-pbbot/lib/proto/onebot_base";
import {
  PrivateMessageEvent,
  GroupMessageEvent,
  ChannelMessageEvent,
} from "ts-pbbot/lib/proto/onebot_event";
import { prefix } from "../tools/logger";
import { MaybeArray } from "./common";

export type MessageAt = {
  type: "at";
  data: { qq: string };
};
export type MessageText = {
  type: "text";
  data: { text: string };
};
export type MessageImage = {
  type: "image";
  data: {
    image_id: string;
    file: string;
    url: string;
  };
};
/**
 * 常见的消息类型
 */
export type MessageCommon = MessageAt | MessageText | MessageImage;

/**
 * 常见的消息类型字符串
 */
export type MessageCommonType = MessageCommon["type"];

export type MessageBack = MaybeArray<string | Msg | Message | undefined>;

/**
 * 消息类型
 */
export type MsgEventType = {
  private: PrivateMessageEvent;
  group: GroupMessageEvent;
  channel: ChannelMessageEvent;
};
/**
 * 将信息组转换为一串信息
 * @param mb 信息组
 * @returns 一串信息
 */
export const toMsg = (mb: MessageBack): Msg | undefined => {
  if (mb === undefined || typeof mb === "string") return s2m(mb);
  if (mb instanceof Msg) return checkMsg(mb.messageList) ? mb : undefined;
  if (Array.isArray(mb)) {
    mb = mb.filter((x) => x !== undefined);
    let hasSenior = mb.some((x) => typeof x !== "string");

    if (hasSenior) {
      const msg = Msg.builder();
      mb.flatMap((x) => (x instanceof Msg ? x.messageList : x)).forEach(
        (x, i, arr) => {
          if (x === undefined) return;
          if (typeof x === "string")
            msg.text(i == arr.length - 1 ? x : x + "\n");
          else {
            msg.messageList.push(x);
            if (i < arr.length - 1) msg.text("\n");
          }
        }
      );
      return msg;
    }
    return s2m(mb.join("\n"));
  }
  if (!checkMsg([mb])) return undefined;
  const msg = Msg.builder();
  msg.messageList.push(mb);
  return msg;
};

export const sendMsg = async <E extends keyof MsgEventType>(
  type: E,
  bot: Bot,
  event: MsgEventType[E],
  msg: MessageBack,
  response: "re" | "at" | "no"
) => {
  if (!(msg = toMsg(msg))) return false;
  switch (type) {
    case "private":
      return await bot.sendPrivateMessage(
        (event as PrivateMessageEvent).userId,
        msg
      );
    case "group":
      if (response === "re") {
        //TODO reply无法使用
        response = "at";
      }
      if (response === "at") {
        msg.at(
          (event as GroupMessageEvent).userId,
          event.sender?.nickname || "-"
        );
        msg.messageList.unshift(msg.messageList.pop()!);
      }
      return await bot.sendGroupMessage(
        (event as GroupMessageEvent).groupId,
        msg
      );
    case "channel":
      if (response === "at") {
        const id = (event as ChannelMessageEvent).sender?.tinyId;
        if (id) {
          msg.at(id, event.sender?.nickname || "-");
          msg.messageList.unshift(msg.messageList.pop()!);
        }
      }
      return await bot.sendChannelMessage(
        (event as ChannelMessageEvent).guildId,
        (event as ChannelMessageEvent).channelId,
        msg
      );
  }
};

/** string to Msg */
function s2m(msg: string | undefined) {
  return msg ? Msg.builder().text(msg) : undefined;
}
/**@returns not empty msg */
function checkMsg(msg: Message[]) {
  return msg.some((x) => x.type !== "text" || (x as MessageText).data.text);
}
