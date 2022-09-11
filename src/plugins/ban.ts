import { cmdTag, registerCommand } from '../lib/command';
import { getNumberByMsg } from '../lib/tools/utils';
import { buildCreate } from '../lib/def/Plugin';
import { pluginDir, readQQ, writeQQ } from '../lib/tools/files';
import { isAdmin } from './admin';
import { GroupMessageEvent } from 'ts-pbbot/lib/proto/onebot_event';
import table from 'text-table';

const filename = {
  bans: 'bans',
  admin: 'admin',
};

export const create = buildCreate(({ name, type, logger }) => {
  const dir = pluginDir(name, type);

  let bans: Set<number>;

  registerCommand(name, 'ban', ['private', 'group'], async ({ args, back, event }) => {
    if (!isAdmin(event.userId)) return;
    const qq = getNumberByMsg(args);
    if (qq === null) {
      const msg: string[] = Array.from(bans).map((x, i) => `${i + 1}. ${x}`);
      msg.unshift('封禁名单: ');
      return back(msg);
    } else if (typeof qq === 'string') return back(`无效的QQ号: [${qq}]`);
    else if (bans.has(qq)) return back(`[${qq}] 已在封禁名单中...\n目前名单内有 ${bans.size} 人`);
    else {
      bans.add(qq);
      writeQQ(dir, filename.bans, Array.from(bans));
      return back(`成功将 [${qq}] 添加至封禁名单\n目前名单内有 ${bans.size} 人`);
    }
  });
  registerCommand(name, 'unban', ['private', 'group'], async ({ args, back, type, event }) => {
    if (!isAdmin(event.userId)) return;
    const qq = getNumberByMsg(args);
    if (qq === null) return back('请输入QQ号' + (type === 'private' ? '' : ', 或直接at对方'));
    else if (typeof qq === 'string') return back(`无效的QQ号: [${qq}]`);
    else if (bans.delete(qq)) {
      writeQQ(dir, filename.bans, Array.from(bans));
      return back(`成功将 [${qq}] 从封禁名单中移除\n目前名单内有 ${bans.size} 人`);
    } else return back(`[${qq}] 不在封禁名单中...\n目前名单内有 ${bans.size} 人`);
  });

  registerCommand(
    name,
    'ban-check',
    ['private', 'group'],
    async ({ bot, args, back, type, event }) => {
      if (!isAdmin(event.userId)) return;
      let group = getNumberByMsg(args);
      if (type === 'group' && group === null) group = (event as GroupMessageEvent).groupId;

      if (group === null) return back('请输入群号, 或直接在群内发送');
      else if (typeof group === 'string') return back(`无效群号: [${group}]`);
      else {
        const list = await bot.getGroupMemberList(group);
        if (!list) return back(`无法获取: 群 [${group}] 的成员列表`);
        const matrix = list.groupMember
          .filter((member) => bans.has(member.userId))
          .map((member, i) => [`${i + 1}.`, member.userId.toString(), member.nickname]);
        if (matrix.length) matrix.unshift(['序号', 'QQ号', '群昵称']);
        else return back('此群没有用户在封禁名单中!');
        const msg = table(matrix, { hsep: '\t' });
        return back(msg);
      }
    },
  );

  return {
    onEnable() {
      bans = new Set(readQQ(dir, filename.bans));
      logger.info('插件启动');
    },
    onDisable() {
      writeQQ(dir, filename.bans, Array.from(bans));
      logger.info('插件关闭');
    },
    getHelp({ groupId }) {
      return [
        `${cmdTag}ban 查询封禁名单`,
        `${cmdTag}ban <qq号/艾特> 拉黑用户`,
        `${cmdTag}unban <qq号/艾特> 解除拉黑`,
        `${cmdTag}ban-check ${groupId ? '[qq群号]' : '<qq群号>'} 列出此群内被拉黑的用户`,
        `${cmdTag}ban-kick ${groupId ? '[qq群号]' : '<qq群号>'} 将此群内被拉黑的用户踢出`,
      ];
    },
  };
});
