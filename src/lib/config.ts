import * as fs from "fs";
import { Document, isMap, isScalar, parse } from "yaml";
import * as deepmerge from "deepmerge";

/**默认配置文件*/
const confDefault = {
  plugins: {
    basic: {
      plugin: "basic",
      config: {},
      bot: [],
    },
  },
  bots: [10001],
};
/**配置文件描述*/
const confComment: Comment = {
  __node_comment__: "QQ机器人配置文件",
  plugins: {
    __node_comment__: "插件配置",
    basic: {
      __node_comment__:
        "插件配置\n同一个插件可以多次使用, 但是插件名称(即节点名称)不能重复",
      plugin: "此插件配置所使用的插件",
      config: {
        __node_comment__:
          "插件的配置信息, 不同的插件的配置信息不同, 详见插件说明",
      },
      bot: "此插件所包括的机器人",
    },
  },
  bots: "所有机器人\n程序只会与在此列出的QQ号进行交互",
};
/**配置文件*/
export let config: Config;

(async () => {
  const file = "./config.yml";
  if (!fs.existsSync(file)) {
    const yaml = new Document(confDefault);

    /** 添加描述 */
    const addComment = (yaml: unknown, node: any) => {
      if (!isMap(yaml)) throw new Error("Bad Node: " + yaml);
      yaml.items.forEach((pair) => {
        if (!isScalar(pair.key)) throw new Error("Bad key: " + pair.key);
        if (typeof pair.key.value !== "string")
          throw new Error("Bad key: " + pair.key.value);
        const data: string | CommentNode<unknown> = node[pair.key.value];

        pair.key.spaceBefore = true;
        if (typeof data === "string") {
          pair.key.commentBefore = data;
        } else if (data) {
          pair.key.commentBefore = data.__node_comment__;
          addComment(pair.value, data);
        }
      });
    };
    addComment(yaml.contents, confComment);
    yaml.commentBefore = confComment.__node_comment__;
    // if (dev) console.log(yaml.toString());
    fs.writeFileSync(file, yaml.toString(), "utf8");
  }
  const confUser = parse(fs.readFileSync(file, "utf8"), {});
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
