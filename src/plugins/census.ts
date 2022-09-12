import { buildCreate, isNeedHandle } from '../lib/def/Plugin';
import 'colors';
import { pluginDir } from '../lib/tools/files';
import { ServiceString, toServiceString } from '../lib/def/ServiceString';
import { register } from '../lib/EventManager';
import { isAdmin } from './admin';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import LRUCache from 'lru-cache';
import { MessageReceipt } from 'ts-pbbot/lib/proto/onebot_base';
import XLSX from 'xlsx';
import { Logger } from '../lib/tools/logger';

const saved = new Set<number>(); //保存过的机器人信息

const lru = new LRUCache<string, true>({ max: 500, ttl: 1000 * 60 });
/**
 * 是否需要跳过消息
 *
 * 在多机器人的情况下, 同一个机器人将会收到多条消息, 此方法用于去重
 * @param ss 服务串
 * @returns 是否需要跳过
 */
const needSkip = (
  ss: ServiceString,
  e: { messageId: MessageReceipt | number | undefined },
): boolean => {
  if (!e.messageId) return false;
  let key: string;
  if (typeof e.messageId === 'number') key = 'n' + e.messageId.toString(36);
  else key = 's' + e.messageId.seqs.join('=');
  key = `${ss} ${key}`;
  if (lru.has(key)) return true;
  lru.set(key, true);
  return false;
};

export const create = buildCreate(({ name, type, logger }) => {
  const dir = pluginDir(name, type);

  let db: Database.Database | null = null;
  let insert: Database.Statement<any[]>;

  const log = (
    bot: number,
    service: ServiceString,
    type: 'U' | 'G' | 'C',
    user: number | string,
    group: number | undefined,
    channel: number | undefined,
    guild: string | number | undefined,
    msg: string,
  ) => {
    if (insert)
      insert.run(bot, service, type, user.toString(), group, channel, guild?.toString(), msg);
  };

  register(name, 'handleConnect', (bot) => {
    if (saved.has(bot.botId)) return;
    else saved.add(bot.botId);
    function delay(time?: number) {
      if (!time) time = Math.random() * 2000 + 1000;
      return new Promise<void>((r) => setTimeout(r, time));
    }
    function log(msg: string) {
      logger.info(Logger.qqColor(bot.botId, undefined), msg);
    }

    (async () => {
      const workbook = XLSX.utils.book_new();

      log('正在获取bot info...');
      const self = await bot.getLoginInfo();
      if (self) {
        const worksheet = XLSX.utils.json_to_sheet([self]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'self');
      }

      await delay();
      log('正在获取friend list...');
      const friends = await bot.getFriendList();
      if (friends) {
        const worksheet = XLSX.utils.json_to_sheet(friends.friend);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'friends');
      }

      await delay();
      log('正在获取group list...');
      const groups = await bot.getGroupList();
      if (groups) {
        const worksheet = XLSX.utils.json_to_sheet(groups.group);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'groups');

        for (const i in groups.group) {
          try {
            await delay();
            const id = groups.group[i].groupId;
            log(`正在获取group member list: ${id} ...`);
            const list = await Promise.race([bot.getGroupMemberList(id), delay(5000)]);
            if (!list) continue;
            const worksheet = XLSX.utils.json_to_sheet(list.groupMember);
            XLSX.utils.book_append_sheet(workbook, worksheet, `G${id}`);
          } catch (err) {
            logger.error(err);
            continue;
          }
        }

        const file = resolve(dir, `${bot.botId}.${Date.now()}.xlsx`);
        log(`正在写出文件: ${file} ...`);
        XLSX.writeFile(workbook, file);
      }
    })();
  });

  register(name, 'handlePrivateMessage', async (bot, event) => {
    if (!event) return;
    const ss = toServiceString('U', event.userId);
    if (!isAdmin(event.userId) && !isNeedHandle(name, bot.botId, ss)) return;
    if (needSkip(ss, event)) return;

    log(bot.botId, ss, 'U', event.userId, undefined, undefined, undefined, event.rawMessage);
  });

  register(name, 'handleGroupMessage', async (bot, event) => {
    if (!event) return;
    const ss = toServiceString('G', event.groupId);
    if (!isNeedHandle(name, bot.botId, ss)) return;
    if (needSkip(ss, event)) return;

    log(bot.botId, ss, 'G', event.userId, event.groupId, undefined, undefined, event.rawMessage);
  });

  register(name, 'handleChannelMessage', async (bot, event) => {
    if (!event) return;
    const ss = toServiceString('C', event.guildId, event.channelId);
    if (!isNeedHandle(name, bot.botId, ss)) return;
    if (needSkip(ss, event)) return;
    const sender = event.sender;
    if (!sender) return;

    log(
      bot.botId,
      ss,
      'C',
      sender.tinyId,
      undefined,
      event.channelId,
      event.guildId,
      event.rawMessage,
    );
  });

  return {
    onEnable() {
      if (db) db.close();
      db = initDB(dir);
      insert = db.prepare(
        `INSERT INTO "msg"("bot","service","type","user","group","channel","guild","msg")VALUES(?,?,?,?,?,?,?,?);`,
      );
      logger.info('插件启动');
    },
    onDisable() {
      if (db) db.close();
      db = null;
      logger.info('插件关闭');
    },
  };
});

function initDB(dir: string) {
  const db = new Database(resolve(dir, 'data.sqlite3.db'));
  db.prepare(
    `CREATE TABLE IF NOT EXISTS "msg" (
"time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"bot" integer NOT NULL,
"service" TEXT NOT NULL,
"user" TEXT NOT NULL,
"group" integer,
"channel" integer,
"guild" TEXT,
"msg" TEXT NOT NULL,
"type" integer NOT NULL
);`,
  ).run();
  return db;
}
