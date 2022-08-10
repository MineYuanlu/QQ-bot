import { buildCreate, Plugin } from "../lib/def/Plugin";
import { register } from "../lib/EventManager";

export const create = buildCreate(({ name, config, bot, logger }) => {
  const botSet = bot.length ? new Set(bot) : null;
  register(name, "handleConnect", async (bot) => {
    if (!botSet || botSet.has(bot.botId))
      console.log(`机器人已连接: ${bot.botId.toString()}`);
  });
  register(name, "handleDisconnect", async (bot) => {
    if (!botSet || botSet.has(bot.botId))
      console.log(`机器人已断开: ${bot.botId.toString()}`);
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
