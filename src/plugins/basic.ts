import { buildCreate } from "../lib/def/Plugin";
import { register } from "../lib/EventManager";
import "colors";
import * as LRUCache from "lru-cache";
import { Logger } from "../lib/tools/logger";

const lru = new LRUCache({ max: 500, ttl: 1000 * 60 });

export const create = buildCreate(({ name, botSet, logger }) => {
  const log = (type: string, bot: number, ...extra: any[]) =>
    logger.info(`[${type}] ${Logger.qqColor(bot, "B")}`, ...extra);
  register(name, "handleConnect", async (bot) => {
    if (botSet && !botSet.has(bot.botId)) return;
    log("连接", bot.botId, "机器人已连接");
  });
  register(name, "handleDisconnect", async (bot) => {
    if (botSet && !botSet.has(bot.botId)) return;
    log("断开", bot.botId, "机器人已断开");
  });
  register(name, "handlePrivateMessage", async (bot, event) => {
    if (!event) return;
    if (botSet && !botSet.has(bot.botId)) return;
    log("私聊", bot.botId, Logger.qqColor(event.userId, "U"), event.rawMessage);
  });
  register(name, "handleGroupMessage", async (bot, event) => {
    if (!event) return;
    if (botSet && !botSet.has(bot.botId)) return;

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
    if (!botSet || botSet.has(bot.botId))
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
