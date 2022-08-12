import { createBotServer } from "ts-pbbot/lib/server/BotWsServer";
import "./lib/config";
import { config } from "./lib/config";
import { CreateHandler, setPluginEnable } from "./lib/def/Plugin";
import { colors, prefix, Logger } from "./lib/tools/logger";

console.log("开始启动");

const loader = async (
  name: string,
  config: { plugin: string; config: any; bot: number[] }
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
    else await plugin.create(name, config.plugin, config.config, config.bot);
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
