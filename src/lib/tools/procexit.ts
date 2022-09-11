import heap from 'heap';

/**结束钩子*/
const runs = new heap<{ func: HookFunc; w: number; name?: string }>((a, b) => b.w - a.w);
/**
 * 添加结束时调用的钩子
 * @param func 结束时调用的函数钩子
 * @param w 调用优先级(默认为0)
 */
export const exitHook = (func: HookFunc, w: number = 0, name?: string) => {
  if (!(func instanceof Function)) throw new Error('func must be a function');
  if (isNaN(w)) throw new Error('NaN weight!');
  runs.push({ func, w, name });
};
type HookFunc = (id: number | any) => void | Promise<void> | any;
/**是否已经执行结束程序*/
let _endFlag = false;
/**
 * 退出函数
 * @param id 退出代码
 * @returns 退出等待
 */
export const exit = async function (id: number | any): Promise<void> {
  if (_endFlag) return;
  _endFlag = true;
  console.log('PROCESS', '控制面板正在结束与回收资源,请稍等...');

  while (!runs.empty()) {
    try {
      const { func, name } = runs.pop()!;
      if (name !== undefined) console.log('开始运行清理钩子:', name);
      await func(id);
    } catch (err) {
      console.error('PROCESS - 无法运行清理钩子', err);
    }
  }
  // 保存
  console.log('PROCESS', 'EXIT...');
  process.exit(isNaN(id) ? 0 : parseInt(id));
};
process.on('SIGINT', exit);
