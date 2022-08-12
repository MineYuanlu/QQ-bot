import { Message } from "ts-pbbot/lib/proto/onebot_base";

/**
 * 随机字符串
 * @param length 字符串长度
 */
export const randomStr = (() => {
  const $chars =
    "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^&*()_+-=[]{},.<>?".split(
      ""
    );
  return (length: number = 16) => {
    return new Array(length)
      .fill(0)
      .map(() => $chars[(Math.random() * $chars.length) | 0])
      .join("");
  };
})();

/**
 * 从(第一个)消息中读取(第一个)数字
 *
 * 分割符:
 * ```js
 * /( |\n|\r|\/|\|)/
 * ```
 * @param msg 消息
 * @returns 数字(`number`) / 无法解析的字符串(`string`) /
 */
export const getNumberByMsg = (
  msg: Message[] | Message
): null | string | number => {
  msg = Array.isArray(msg) ? msg[0] : msg;
  if (!msg) return null;

  let str: string | number = NaN;
  if (msg.type === "text")
    str = msg.data.text.trim().split(/( |\n|\r|\/|\|)/)[0];
  else if (msg.type === "at") str = msg.data.qq;

  const num = Number(str);
  if (isNaN(num)) return str;
  return num;
};
