# QQ-bot

插件驱动的机器人框架, 使用[2mf8/TSPbBot](https://github.com/2mf8/TSPbBot)作为核心  

## 框架特性
- 插件驱动
- 配置文件描述插件
- 插件开关
- 命令系统
- 事件系统
- 文件系统
- 简易日志

## 使用介绍
[ProtobufBot](https://github.com/ProtobufBot/ProtobufBot)

## 开发介绍

### 基于源码开发
fork本仓库, 并clone到本地, 在`src/plugins`内(参考其他内置插件)编写自己的插件.  
每个插件都需要导出`create`作为插件接口, 同一个插件可能会被实例化多次
```js
export const create = buildCreate(({ name, botSet, logger }) => {
    //在此处初始化插件(如注册插件事件、注册插件命令、加载runtime文件)
    return {
        //插件接口, 包含onEnable等方法
    }
}
```

### 项目运行

- `npm run dev`: 运行开发, 控制台输入rs重启程序
- `npm run build`: 构建项目, 输出在`./dist`文件夹内
- `npm run server`: 生产环境运行, 需要先构建项目