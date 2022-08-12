import { buildCreate } from "../lib/def/Plugin";
import { register } from "../lib/EventManager";
import "colors";

export const create = buildCreate(({ name, botSet, logger }) => {
  register(name, "handleConnect", async (bot) => {
    if (!botSet || botSet.has(bot.botId))
      console.log(`机器人已连接: ${bot.botId.toString().bgWhite.black}`);
  });
  register(name, "handleDisconnect", async (bot) => {
    if (!botSet || botSet.has(bot.botId))
      console.log(`机器人已断开: ${bot.botId.toString().bgWhite.black}`);
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
