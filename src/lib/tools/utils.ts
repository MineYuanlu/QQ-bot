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
