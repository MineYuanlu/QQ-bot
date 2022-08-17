import { Bot } from "ts-pbbot";
import { Message } from "ts-pbbot/lib/proto/onebot_base";
import type {
  PrivateMessageEvent,
  GroupMessageEvent,
  ChannelMessageEvent,
} from "ts-pbbot/lib/proto/onebot_event";
import { config } from "./config";
import { MaybePromise } from "./def/common";
import {
  MessageAt,
  MessageBack,
  MessageCommonType,
  MessageText,
  MsgEventType,
  sendMsg,
  toMsg,
} from "./def/Message";
import { isEnabled, isNeedHandleEvent, plugins } from "./def/Plugin";
import { registerInternal } from "./EventManager";
import { colors, Logger, prefix } from "./tools/logger";

export const cmdTag = "!";

/**
 * 命令处理器的参数
 */
export type CommandArgs<E extends keyof MsgEventType> = {
  /**命令 (注册时的命令) */
  cmd: string;
  /**原始命令 (可能包含namespace) */
  realcmd: string;
  /**参数, 即去掉(At和)命令部分的后续内容 */
  args: Message[];
  /**
   * 命令响应
   * @param msg 响应的内容
   * @param response 响应格式(`re`: 回复原消息, `at`: 艾特用户, `no`: 直接发送), 默认为`re`
   */
  back: (msg: MessageBack, response?: "re" | "at" | "no") => Promise<void>;

  /**
   * 发出加载提示
   */
  loadingNotice: (finish?: boolean) => Promise<void>;
  /**
   * 机器人
   */
  bot: Bot;
  /**
   * 消息事件
   */
  event: MsgEventType[E];
  /**
   * 消息类型
   */
  type: E;
};

/**
 * 一条命令的信息
 */
type CommandInfo = {
  /**插件名称 */
  name: string;
  /**命令 */
  cmd: string;
  /**处理器 */
  handler: {
    [k in keyof MsgEventType]?: (cmd: CommandArgs<k>) => MaybePromise<void>;
  };
};

/**所有命令 `cmd`->`info` */
const commands: Record<string, CommandInfo> = {};

/**
 * 注册命令
 * @param name 插件名称
 * @param cmds 命令
 * @param handler 处理器
 */
export function registerCommand<E extends keyof MsgEventType>(
  name: string,
  cmds: string | string[],
  type: E | E[],
  handler: (cmd: CommandArgs<E>) => MaybePromise<void>
) {
  if (typeof cmds === "string") cmds = [cmds];
  cmds.forEach((cmd) => {
    if (cmd.indexOf(":") >= 0) throw new Error("非法命令: " + cmd);
  });

  const setInfo = (target: string, cmd: string) => {
    const old: CommandInfo | undefined = commands[target];
    const info: CommandInfo = { name, cmd, handler: { ...old?.handler } };
    (typeof type === "string" ? [type] : type).forEach(
      (t) => (info.handler[t] = handler as any)
    );
    commands[target] = info;
  };
  cmds.forEach((cmd) => {
    if (!commands[cmd] || commands[cmd].name === name) {
      setInfo(cmd, cmd);
    } else {
      console.warn(
        prefix.CMD,
        Logger.pluginColor(name),
        `命令 "${cmd}" 与`,
        Logger.pluginColor(commands[name].name),
        `冲突`
      );
    }
    setInfo(`${name}:${cmd}`, cmd);
  });
  console.log(
    prefix.CMD,
    Logger.pluginColor(name),
    "已注册命令:",
    colors.magenta(`[${cmds.join(", ")}]`)
  );
}
/**
 * 命令处理器
 * @param bot Bot
 * @param event Event
 * @param type
 * @returns
 */
const handler = async <E extends keyof MsgEventType>(
  bot: Bot | undefined,
  event: MsgEventType[E] | undefined,
  type: E
): Promise<void> => {
  if (!bot || !event) return;
  if (event.messageType !== type)
    return err(`无法处理消息事件: mt: ${event.messageType} != ${type}`);

  if (event.postType !== "message")
    return err(`无法处理消息事件: pt: ${event.postType}`);

  const message = [...event.message];

  //消息指向性检查, 私聊消息/首位为at机器人
  if (!message.length) return;
  if ((message[0]?.type as MessageCommonType) === "at") {
    const at = message.shift() as MessageAt;
    if (at.data.qq != event.selfId.toString()) return;
    if (!message.length) return;
  } else if (type !== "private") return;

  //截取命令标记
  const fst = message[0] as MessageText;
  if (fst?.type !== "text" || !fst.data.text) return;
  const fstTxt = fst.data.text.trimStart().split(" ");
  let realcmd = fstTxt[0];
  if (
    !realcmd ||
    realcmd.length < cmdTag.length + 1 ||
    !realcmd.startsWith(cmdTag)
  )
    return;

  //获取命令并检测插件是否正在使用
  realcmd = realcmd.substring(cmdTag.length);
  const cmd = commands[realcmd];
  const handler = cmd.handler[type];
  if (!cmd || !handler) return;
  if (!isNeedHandleEvent(cmd.name, event, type)) return;

  //调试
  if (config.debug)
    console.debug(
      prefix.DEBUG,
      prefix.CMD,
      "唤起命令:",
      colors.bold(realcmd),
      `(来自${Logger.pluginColor(cmd.name)})`
    );

  //处理参数 message -> args
  fstTxt.shift();
  if (!fstTxt.length || !(fst.data.text = fstTxt.join(" ").trim()))
    message.shift();

  await handler({
    cmd: cmd.cmd,
    realcmd,
    args: message,
    bot,
    event,
    type,
    async back(msg, response = "re") {
      sendMsg(type, bot, event, msg, response);
    },
    async loadingNotice(finish = false) {},
  });
};

registerInternal("handlePrivateMessage", (bot, event) =>
  handler(bot, event as any, "private")
);
registerInternal("handleGroupMessage", (bot, event) =>
  handler(bot, event as any, "group")
);
registerInternal("handleChannelMessage", (bot, event) =>
  handler(bot, event as any, "channel")
);

/**打印错误 */
function err(...arg: any[]) {
  console.error(prefix.ERROR, prefix.CMD, ...arg);
}
