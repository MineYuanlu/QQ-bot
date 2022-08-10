import { createBotServer } from "ts-pbbot/lib/server/BotWsServer";
import { readdirSync } from "fs";
import "./lib/config";
import { config } from "./lib/config";
import { setPluginEnable } from "./lib/def/Plugin";
const port = 8081;

console.log("开始启动");

const loader = async (
  name: string,
  config: { plugin: string; config: any; bot: (number | string)[] }
) => {
  const plugin = await import("./plugins/" + config.plugin);
  if (!plugin.create)
    console.error("[ERROR]", `无法加载插件 "${plugin}", 因为其没有构造器!`);
  else await plugin.create(name, config.config, config.bot);
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

  createBotServer(port);
  console.log(`启动成功，端口：${port}`);
})();
