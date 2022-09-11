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
    type: 'U' | 'G' | 'C',
    user: number | string,
    group: number | undefined,
    channel: number | undefined,
    guild: string | number | undefined,
    msg: string,
  ) => {
    // "bot","type","user","group","channel","guild","msg"
    if (insert) insert.run(bot, type, user, group, channel, guild, msg);
  };

  register(name, 'handlePrivateMessage', async (bot, event) => {
    if (!event) return;
    const ss = toServiceString('U', event.userId);
    if (!isAdmin(event.userId) && !isNeedHandle(name, bot.botId, ss)) return;
    if (needSkip(ss, event)) return;

    log(bot.botId, 'U', event.userId, undefined, undefined, undefined, event.rawMessage);
  });

  register(name, 'handleGroupMessage', async (bot, event) => {
    if (!event) return;
    const ss = toServiceString('G', event.groupId);
    if (!isNeedHandle(name, bot.botId, ss)) return;
    if (needSkip(ss, event)) return;

    log(bot.botId, 'G', event.userId, event.groupId, undefined, undefined, event.rawMessage);
  });

  register(name, 'handleChannelMessage', async (bot, event) => {
    if (!event) return;
    const ss = toServiceString('C', event.guildId, event.channelId);
    if (!isNeedHandle(name, bot.botId, ss)) return;
    if (needSkip(ss, event)) return;
    const sender = event.sender;
    if (!sender) return;

    log(bot.botId, 'C', sender.tinyId, undefined, event.channelId, event.guildId, event.rawMessage);
  });

  return {
    onEnable() {
      if (db) db.close();
      db = initDB(dir);
      insert = db.prepare(
        `INSERT INTO "msg"("bot","type","user","group","channel","guild","msg")VALUES(?,?,?,?,?,?,?);`,
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
"user" TEXT NOT NULL,
"group" integer,
"channel" integer,
"guild" TEXT,
"msg" TEXT NOT NULL
"type" integer NOT NULL,
);`,
  ).run();
  return db;
}
