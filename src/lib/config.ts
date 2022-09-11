import * as fs from 'fs';
import { Document, isMap, isScalar, parse } from 'yaml';
import deepmerge from 'deepmerge';

/**默认配置文件*/
const confDefault = {
  debug: false,
  plugins: {
    basic: {
      plugin: 'basic',
      config: {},
      bot: [],
      service: [],
    },
    help: {
      plugin: 'help',
    },
    census: {
      plugin: 'census',
    },
    admin: {
      plugin: 'admin',
      config: {
        admin: [],
      },
    },
  },
  port: 8081,
  bots: [],
};
/**配置文件描述*/
const confComment: Comment = {
  __node_comment__: 'QQ机器人配置文件',
  debug: '调试模式',
  plugins: {
    __node_comment__: '插件配置\n同一个插件可以多次使用, 但是插件名称(即节点名称)不能重复',
    basic: {
      __node_comment__: '基础日志',
      plugin: '此插件配置所使用的插件',
      config: {
        __node_comment__: '插件的配置信息, 不同的插件的配置信息不同, 详见插件说明',
      },
      bot: '此插件所包括的机器人\n不填即代表所有机器人',
      service:
        "此插件所启用的目标(用户/群聊/频道/子频道)\n管理员私聊将无视权限\n不填即代表所有目标\n\n用户: U+'qq号': 'U12345'\n群聊: G+'群号': 'G12345'\n频道: C+'频道号': 'C12345'\n子频道: C+'频道号'/'子频道号': 'C12345/67890'",
    },
    help: {
      __node_comment__: '显示帮助列表',
      plugin: '',
    },
    admin: {
      __node_comment__: '机器人管理员',
      plugin: '',
      config: {
        __node_comment__: '',
        admin:
          '初始的管理员, 请将此设置为自己的QQ号\n机器人运行后, 管理员可以动态添加其他QQ为管理员\n每次重启此插件都将添加此列表内的用户为管理员',
      },
    },
  },
  port: 'QQ Bot Server 端口号\n请与QQ Bot Client (GMC等)保持一致',
  bots: '所有机器人\n程序只会与在此列出的QQ号进行交互\n不填则接受所有机器人',
};
/**配置文件*/
export let config: Config;

(async () => {
  const file = './config.yml';
  if (!fs.existsSync(file)) {
    const yaml = new Document(confDefault);

    /** 添加描述 */
    const addComment = (yaml: unknown, node: any) => {
      if (!isMap(yaml)) throw new Error('Bad Node: ' + yaml);
      yaml.items.forEach((pair) => {
        if (!isScalar(pair.key)) throw new Error('Bad key: ' + pair.key);
        if (typeof pair.key.value !== 'string') throw new Error('Bad key: ' + pair.key.value);
        const data: string | CommentNode<unknown> = node[pair.key.value];

        pair.key.spaceBefore = true;
        if (typeof data === 'string') {
          if (data) pair.key.commentBefore = data;
        } else if (data) {
          if (data.__node_comment__) pair.key.commentBefore = data.__node_comment__;
          addComment(pair.value, data);
        }
      });
    };
    addComment(yaml.contents, confComment);
    yaml.commentBefore = confComment.__node_comment__;
    fs.writeFileSync(file, yaml.toString(), 'utf8');
  }
  const confUser = parse(fs.readFileSync(file, 'utf8'), {});
  config = deepmerge(confDefault, confUser, {
    arrayMerge: (_def: any, user: any) => user,
    clone: true,
  });
})();

/**
 * 配置文件结构
 */
export type Config = typeof confDefault;
/**
 * 结构节点描述
 *
 * 需要拥有与指定结构一致的结构, 但所有基础类型及数组都被替换为字符串
 */
export type CommentNode<T> = {
  [k in keyof T]: T[k] extends object
    ? T[k] extends Array<any>
      ? string
      : CommentNode<T[k]>
    : string;
} & { __node_comment__: string };

/** 配置文件结构描述 */
export type Comment = CommentNode<Config>;
