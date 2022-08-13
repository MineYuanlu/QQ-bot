import { createBotServer } from "ts-pbbot/lib/server/BotWsServer";
import "./lib/config";
import { config } from "./lib/config";
import { CreateHandler, setPluginEnable } from "./lib/def/Plugin";
import { handlerAction, registerInternal } from "./lib/EventManager";
import { colors, prefix, Logger } from "./lib/tools/logger";

console.log("开始启动");

const loader = async (
  name: string,
  config: { plugin: string; config?: any; bot?: number[] | number }
) => {
  try {
    const plugin: { create?: CreateHandler } = await import(
      "./plugins/" + config.plugin
    );
    if (!plugin.create)
      console.error(
        prefix.ERROR,
        "无法加载插件:",
        Logger.pluginColor(name),
        "因为其没有构造器!"
      );
    else {
      let bot: number[];
      if (Array.isArray(config.bot)) bot = config.bot.filter((x) => !isNaN(x));
      else if (typeof config.bot === "number") bot = [config.bot];
      else bot = [];
      await plugin.create(name, config.plugin, config.config || {}, bot);
    }
  } catch (err) {
    console.error(
      prefix.ERROR,
      "无法加载插件:",
      Logger.pluginColor(name),
      "加载时出错:",
      err
    );
  }
};

(async () => {
  const bots = ((arr) => {
    if (
      arr &&
      (arr = arr.map((x) => Number(x)).filter((x) => !isNaN(x))).length
    )
      return new Set(arr);
  })(config.bots as number[]);
  if (bots) {
    console.log("机器人列表", Array.from(bots));
    const disconnected = new Set<number>();
    registerInternal("handleConnect", async (bot) => {
      const id = bot.botId;
      if (bots.has(id)) return;
      try {
        if (!disconnected.has(id))
          console.warn(
            prefix.WARN,
            "机器人列表外的机器人加入:",
            Logger.qqColor(id, "B")
          );
        disconnected.add(id);
      } catch (err) {
      } finally {
        try {
          bot.session.close();
        } catch (err) {}
      }
      return handlerAction.prevent;
    });
    registerInternal(
      "handleDisconnect",
      (bot) => bots.has(bot.botId) || handlerAction.prevent
    );
  }
  await Promise.all(
    Object.keys(config.plugins).map((key) =>
      loader(key, config.plugins[key as keyof typeof config.plugins])
    )
  );
  await Promise.all(
    Object.keys(config.plugins).map((name) => setPluginEnable(name, true))
  );

  createBotServer(config.port);
  console.log(`启动成功，端口：${colors.cyan(config.port.toString())}`);
})();
