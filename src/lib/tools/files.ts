import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**运行时文件夹 */
export const runtimeDir = resolve('runtime');
mkdir(runtimeDir);

/**
 * 获取插件文件夹
 * @param name
 * @param type
 */
export const pluginDir = (name: string, type: string) => {
  const dir = resolve(runtimeDir, `[${type}]${name}`);
  mkdir(dir);
  return dir;
};

function mkdir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir);
}

/**
 * 读取QQ号
 * @param dir 文件夹
 * @param file 文件名
 * @returns QQ号
 */
export const readQQ = (dir: string, file: string): number[] => {
  file = resolve(dir, file + '.qq.txt');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8') //
    .replace(/\r/g, '') //
    .split('\n') //
    .map((x) => parseInt(x.trim())) //
    .filter((x) => !isNaN(x));
};

/**
 * 写出QQ号
 * @param dir 文件夹
 * @param file 文件名
 * @param qq QQ号
 */
export const writeQQ = (dir: string, file: string, qq: number[] | Set<number>): void => {
  writeFileSync(
    resolve(dir, file + '.qq.txt'),
    (Array.isArray(qq) ? qq : Array.from(qq)).filter((x) => !isNaN(x)).join('\n'),
    'utf8',
  );
};
