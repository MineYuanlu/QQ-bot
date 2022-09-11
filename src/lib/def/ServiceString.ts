/**
 * 服务目标描述字符串
 */
export type ServiceString = `${'U' | 'G' | 'C'}${number}` | `C${number}/${number}`;

/**
 * 是否是服务目标描述字符串
 */
export const isServiceString = (val: any): val is ServiceString => {
  if (typeof val !== 'string') return false;
  return /^([UGC]\d+|C\d+\/\d+)$/.test(val);
};

/**
 * 将 `C${number}/${number}` 转换为 `C${number}`
 *
 * 其它情况将返回null
 * @param ss ServiceString
 * @returns GuildServiceString / null
 */
export const channel2guild = (ss: ServiceString): ServiceString | null => {
  if (!ss || !ss.startsWith('C') || ss.indexOf('/') < 0) return null;
  return ss.substring(0, ss.indexOf('/')) as ServiceString;
};

/**
 * 转换为服务目标描述字符串
 * @param type 类型
 * @param id userId / groupId / guildId
 */
export function toServiceString(type: 'U' | 'G' | 'C', id: number | string): ServiceString;
/**
 * 转换为服务目标描述字符串
 * @param type 频道
 * @param id guildId
 * @param id2 channelId
 */
export function toServiceString(
  type: 'C',
  id: number | string,
  id2?: number | string,
): ServiceString;
export function toServiceString(
  type: 'U' | 'G' | 'C',
  id: number | string,
  id2?: number | string,
): ServiceString {
  let str = `${type}${id}`;
  if (id2 && type === 'C') str = `${str}/${id}`;
  return str as ServiceString;
}
