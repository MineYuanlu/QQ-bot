import { Bot } from 'ts-pbbot';
import { MessageReceipt } from 'ts-pbbot/lib/proto/onebot_base';

const temps: Record<
  string,
  {
    timer: NodeJS.Timeout;
    clear: () => void;
  }
> = {};
let tempIndex = 0;

/**
 * 监听临时消息
 * @param bot 机器人
 * @param id 消息追踪id
 * @param timeout 最大停留时长(非管理员最多两分钟)
 * @returns 消息撤回键
 */
export const watchTempMsg = (
  bot: Bot,
  id: MessageReceipt,
  timeout: number = (1000 * 60 * 1.5) | 0,
): string => {
  const key = (tempIndex++).toString(36);
  const clear = () => {
    bot.deleteMsg(id);
    delete temps[key];
  };
  const timer = setTimeout(clear, timeout);
  temps[key] = { timer, clear };
  return key;
};

/**
 * 撤回临时消息
 * @param key 消息撤回键
 * @returns 是否成功撤回(false: 键不存在, 消息已被清理)
 */
export const deleteTempMsg = (key: string) => {
  const data = temps[key];
  if (!data) return false;
  clearTimeout(data.timer);
  data.clear();
  return true;
};
