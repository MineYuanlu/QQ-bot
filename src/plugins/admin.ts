import { buildCreate } from "../lib/def/Plugin";
import "colors";
import { cmdTag, registerCommand } from "../lib/command";
import { getNumberByMsg } from "../lib/tools/utils";
import { pluginDir, readQQ, writeQQ } from "../lib/tools/files";

const filename = "admin";

let admins: Set<number> | undefined = undefined;

/**
 * 判断用户是否是管理员
 * @param qq 用户
 * @returns 是否是管理员
 */
export function isAdmin(qq: number | string) {
  if (typeof admins === "undefined") return false;
  qq = Number(qq);
  if (isNaN(qq)) return false;
  return admins.has(qq);
}

export const create = buildCreate(({ name, type, logger, config }) => {
  if (admins) throw new Error("admin插件仅可使用一次!");
  admins = new Set();

  const dir = pluginDir(name, type);

  registerCommand(
    name,
    "admin",
    ["private", "group"],
    ({ event, args, back }) => {
      if (!isAdmin(event.userId)) return;
      const qq = getNumberByMsg(args);
      if (qq === null) {
        //list
        const msg: string[] = Array.from(admins!).map(
          (x, i) => `${i + 1}. ${x}`
        );
        msg.unshift("管理员列表: ");
        back(msg);
      } else if (typeof qq === "string") back(`无效的QQ号: [${qq}]`);
      else if (admins!.delete(qq)) {
        writeQQ(dir, filename, admins!);
        back(`已经移除 ${qq} 的管理员权限`);
      } else {
        admins!.add(qq);
        writeQQ(dir, filename, admins!);
        back(`已经将 ${qq} 设置为管理员`);
      }
    }
  );

  return {
    onEnable() {
      admins = new Set(readQQ(dir, filename));
      const conf = config.admin;
      if (Array.isArray(conf)) {
        const size = admins.size;
        conf
          .map((x) => Number(x))
          .filter((x) => !isNaN(x))
          .forEach((x) => admins!.add(x));
        if (size !== admins.size) writeQQ(dir, filename, admins);
      }
      logger.info("插件启动");
    },
    onDisable() {
      writeQQ(dir, filename, admins!);
      logger.info("插件关闭");
    },
    getHelp() {
      return [
        `${cmdTag}admin 列出管理员列表`,
        `${cmdTag}admin [qq] 添加/移除管理员权限`,
      ];
    },
    noClose: true,
  };
});
