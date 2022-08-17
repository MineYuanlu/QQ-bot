import { buildCreate, isNeedHandle } from "../lib/def/Plugin";
import { register } from "../lib/EventManager";
import "colors";
import * as LRUCache from "lru-cache";
import { Logger } from "../lib/tools/logger";
import { ServiceString, toServiceString } from "../lib/def/ServiceString";
import { MessageReceipt } from "ts-pbbot/lib/proto/onebot_base";
import { isAdmin } from "./admin";

const lru = new LRUCache<string, true>({ max: 500, ttl: 1000 * 60 });
/**
 * 是否需要跳过消息
 *
 * 在多机器人的情况下, 同一个机器人将会收到多条消息, 此方法用于去重
 * @param ss 服务串
 * @returns 是否需要跳过
 */
const needSkip = (
  ss: ServiceString,
  e: { messageId: MessageReceipt | number | undefined }
): boolean => {
  if (!e.messageId) return false;
  let key: string;
  if (typeof e.messageId === "number") key = "n" + e.messageId.toString(36);
  else key = "s" + e.messageId.seqs.join("=");
  key = `${ss} ${key}`;
  if (lru.has(key)) return true;
  lru.set(key, true);
  return false;
};

export const create = buildCreate(({ name, logger }) => {
  const log = (type: string, bot: number, ...extra: any[]) =>
    logger.info(`[${type}] ${Logger.qqColor(bot, "B")}`, ...extra);

  register(name, "handleConnect", async (bot) => {
    log("连接", bot.botId, "机器人已连接");
  });

  register(name, "handleDisconnect", async (bot) => {
    log("断开", bot.botId, "机器人已断开");
  });

  register(name, "handlePrivateMessage", async (bot, event) => {
    if (!event) return;
    const ss = toServiceString("U", event.userId);
    if (!isAdmin(event.userId) && !isNeedHandle(name, bot.botId, ss)) return;
    if (needSkip(ss, event)) return;

    log("私聊", bot.botId, Logger.qqColor(event.userId, "U"), event.rawMessage);
  });

  register(name, "handleGroupMessage", async (bot, event) => {
    if (!event) return;
    const ss = toServiceString("G", event.groupId);
    if (!isNeedHandle(name, bot.botId, ss)) return;
    if (needSkip(ss, event)) return;

    log(
      "群聊",
      bot.botId,
      Logger.qqColor(event.groupId, "G"),
      Logger.qqColor(event.userId, "U"),
      event.rawMessage
    );
  });

  register(name, "handleChannelMessage", async (bot, event) => {
    if (!event) return;
    const ss = toServiceString("C", event.guildId, event.channelId);
    if (!isNeedHandle(name, bot.botId, ss)) return;
    if (needSkip(ss, event)) return;

    log(
      "频道",
      bot.botId,
      Logger.channelColor(event.channelId, event.guildId),
      Logger.qqColor(event.sender?.tinyId, "U"),
      event.rawMessage
    );
  });

  return {
    onEnable() {
      logger.info("插件启动");
    },
    onDisable() {
      logger.info("插件关闭");
    },
  };
});
