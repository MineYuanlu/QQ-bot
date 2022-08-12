import { Msg } from "ts-pbbot";
import { registerCommand } from "../lib/command";
import { toMsg } from "../lib/def/Message";
import { buildCreate, Plugin, plugins } from "../lib/def/Plugin";
import { register } from "../lib/EventManager";

const getHelp = async (data: {
  sender: number;
  bot: number;
  groupId?: number;
}): Promise<Msg | undefined> => {
  const helps = Msg.builder();
  for (const key in plugins) {
    const p = plugins[key];
    if (!p.enabled) continue;
    if (p.bot.length && !p.bot.includes(data.bot)) continue;

    const func = p.plugin.getHelp;
    if (!func) continue;

    let txt = toMsg(await func(data));
    if (!txt) continue;

    helps.text(`· ${key} (${p.type}) 帮助:\n`);
    helps.messageList.push(...txt.messageList);
    helps.text("\n\n\n");
  }
  helps.messageList.pop();
  return helps.messageList.length ? helps : undefined;
};

export const create = buildCreate(({ name, logger }) => {
  registerCommand(
    name,
    ["help", "帮助"],
    ["private", "group"],
    async ({ bot, event, back }) => {
      const sender = event.userId;
      const help = await getHelp({ sender, bot: bot.botId });
      back(help || "暂无合适的帮助", "at");
    }
  );
  return {
    onEnable() {
      logger.info("插件启动");
    },
    onDisable() {
      logger.info("插件关闭");
    },
    getHelp({}) {
      return "!help / !帮助   列出帮助列表";
    },
    noClose: true,
  };
});
