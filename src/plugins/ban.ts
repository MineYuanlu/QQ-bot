import { registerCommand } from "../lib/command";
import { getNumberByMsg } from "../lib/tools/utils";
import { buildCreate } from "../lib/def/Plugin";
import { pluginDir, readQQ, writeQQ } from "../lib/tools/files";

const filename = {
  bans: "bans",
  admin: "admin",
};

export const create = buildCreate(({ name, type, config, logger }) => {
  const admin: number[] = [];
  if (typeof config.admin === "number") admin.push(config.admin);
  else if (Array.isArray(config.admin)) admin.push(...config.admin);

  const dir = pluginDir(name, type);

  let bans: Set<number>;

  registerCommand(
    name,
    "ban",
    ["private", "group"],
    async ({ args, back, type }) => {
      const qq = getNumberByMsg(args);
      if (qq === null)
        back("请输入QQ号" + (type === "private" ? "" : ", 或直接at对方"));
      else if (typeof qq === "string") back(`无效的QQ号: [${qq}]`);
      else if (bans.has(qq))
        back(`[${qq}] 已在封禁名单中...\n目前名单内有 ${bans.size} 人`);
      else {
        bans.add(qq);
        back(`成功将 [${qq}] 添加至封禁名单\n目前名单内有 ${bans.size} 人`);
        writeQQ(dir, filename.bans, Array.from(bans));
      }
    }
  );
  registerCommand(
    name,
    "unban",
    ["private", "group"],
    async ({ args, back, type }) => {
      const qq = getNumberByMsg(args);
      if (qq === null)
        back("请输入QQ号" + (type === "private" ? "" : ", 或直接at对方"));
      else if (typeof qq === "string") back(`无效的QQ号: [${qq}]`);
      else if (bans.delete(qq)) {
        back(`成功将 [${qq}] 从封禁名单中移除\n目前名单内有 ${bans.size} 人`);
        writeQQ(dir, filename.bans, Array.from(bans));
      } else back(`[${qq}] 不在封禁名单中...\n目前名单内有 ${bans.size} 人`);
    }
  );
  registerCommand(
    name,
    "ban",
    ["private", "group"],
    async ({ args, back, type }) => {
      const qq = getNumberByMsg(args);
      if (qq === null)
        back("请输入QQ号" + (type === "private" ? "" : ", 或直接at对方"));
      else if (typeof qq === "string") back(`无效的QQ号: [${qq}]`);
      else if (bans.has(qq))
        back(`[${qq}] 已在封禁名单中...\n目前名单内有 ${bans.size} 人`);
      else {
        bans.add(qq);
        back(`成功将 [${qq}] 添加至封禁名单\n目前名单内有 ${bans.size} 人`);
        writeQQ(dir, filename.bans, Array.from(bans));
      }
    }
  );

  return {
    onEnable() {
      bans = new Set(readQQ(dir, filename.bans));
      logger.info("插件启动");
    },
    onDisable() {
      writeQQ(dir, filename.bans, Array.from(bans));
      logger.info("插件关闭");
    },
    getHelp({ groupId }) {
      return [
        "!ban [qq号/艾特] 拉黑用户",
        "!unban [qq号/艾特] 解除拉黑",
        `!ban-check ${groupId ? "" : "[qq群号]"} 列出此群内被拉黑的用户`,
        `!ban-kick ${groupId ? "" : "[qq群号]"} 将此群内被拉黑的用户踢出`,
      ];
    },
  };
});
