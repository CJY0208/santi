# Santi

基于 [create-react-app](https://create-react-app.dev/) 和 [jsdom](https://github.com/jsdom/jsdom)，SPA/预渲染/SSR 三位一体

SSR 功能基于 jsdom，每次渲染需启动 jsdom 沙盒，相对于 React 官方 renderToString 方案存在较大性能差异

目前主要针对低并发高可用性或高并发低可用性等低计算量场景

具体可参考[压测表现](#benchmark)

## Features

- [x] 自动内联关键样式，更快呈现首屏（[对比 Nextjs](#fpspeed)）
- [x] SSR 无需关注服务端 / 客户端差异
- [x] SSR 使用沙盒渲染，无需关注同构时的内存泄漏问题
- [x] SPA、预渲染、SSR 功能渐进式开启或关闭
- [x] 性能良好（搭配合理的缓存，单核心 500QPS + 20ms/AVG 响应）
- [ ] SSR 页面 + 组件级缓存，自由控制
- [ ] SSR 分片支持

## 兼容性

需要 React Hooks 支持

## Usage

> 需要先使用 [create-react-app](https://create-react-app.dev/docs/getting-started) 生成项目
>
> 或者直接参考完整示例项目 [example](https://github.com/CJY0208/santi/tree/master/example)

1. 安装 santi 依赖

   ```bash
   npm install santi --save
   # or
   yarn add santi
   ```

2. 在 `package.json` 中增加 `"config-overrides-path"` 项，并替换 scripts 执行部分

   `serve` 命令用于启动构建模式后的 SSR 或静态资源代理服务

   **NOTE：暂不支持 `test` 命令，请勿使用 `react-scripts eject` 命令**

   ```diff
   /* package.json */
   {
     ...
     "scripts": {
       ...
   -   "start": "react-scripts start",
   +   "start": "santi start",
   -   "build": "react-scripts build",
   +   "build": "santi build"
   +   "serve": "santi serve",
       ...
      },
   + "config-overrides-path": "./node_modules/santi/config",
     ...
   }
   ```

3. 使用 `santi.render` 替代 `ReactDOM.render`

   ```diff
   - import { render } from 'react-dom
   + import { render } from 'santi'

   render(<App />, document.getElementById('root'))
   ```

## SSR TODO

- [x] ~~State~~
- [x] ~~Async props~~
- [ ] View cache config
- [ ] Component cache config
- [ ] Fragmented transmission

---

## <div id="fpspeed" /> FP/FMP/TTI Compare with Nextjs

### 55 节点数，无异步任务场景

|        | Network | CPU                      | First Contentful Paint(s) | First Meaningful Paint(s) | Time to Interactive(s) |
| ------ | ------- | ------------------------ | ------------------------- | ------------------------- | ---------------------- |
| Nextjs | Fast 3G | Mobile (PC 4x Slowndown) | 1.8                       | 1.8                       | 2.0                    |
| Santi  | Fast 3G | Mobile (PC 4x Slowndown) | 0.6                       | 0.6                       | 1.4                    |
| Nextjs | Wifi    | PC                       | 0.2                       | 0.2                       | 0.2                    |
| Santi  | Wifi    | PC                       | 0.1                       | 0.1                       | 0.1                    |

### 4710 节点数（55 节点 repeat 100x），无异步任务场景

|        | Network | CPU                      | First Contentful Paint(s) | First Meaningful Paint(s) | Time to Interactive(s) |
| ------ | ------- | ------------------------ | ------------------------- | ------------------------- | ---------------------- |
| Nextjs | Fast 3G | Mobile (PC 4x Slowndown) | 3.1                       | 3.1                       | 3.4                    |
| Santi  | Fast 3G | Mobile (PC 4x Slowndown) | 0.8                       | 3.2                       | 3.2                    |
| Nextjs | Wifi    | PC                       | 0.2                       | 0.2                       | 0.2                    |
| Santi  | Wifi    | PC                       | 0.6                       | 0.9                       | 0.9                    |

---

## <div id="benchmark" />SSR Benchmark Compare with Nextjs

### 55 节点数，无异步任务场景，限定 2000 样本、i7-4790 基准测试

#### 并发数 1

|        | 可用性     | 集群数 | 完成时间（秒） | QPS    | 平均响应时间（秒） |
| ------ | ---------- | ------ | -------------- | ------ | ------------------ |
| Nextjs | 全量计算   | 1      | 5.436          | 369.37 | 0.002707           |
| Santi  | 全量计算   | 1      | 105.966        | 18.88  | 0.052970           |
| Santi  | 缓存 100ms | 1      | 5.906          | 339.54 | 0.002945           |
| Nextjs | 全量计算   | 6      | 5.705          | 352.00 | 0.002841           |
| Santi  | 全量计算   | 6      | 107.991        | 18.52  | 0.053981           |
| Santi  | 缓存 100ms | 6      | 7.315          | 274.09 | 0.003648           |

#### 并发数 10

|        | 可用性     | 集群数 | 完成时间（秒） | QPS    | 平均响应时间（秒） |
| ------ | ---------- | ------ | -------------- | ------ | ------------------ |
| Nextjs | 全量计算   | 1      | 2.316          | 874.68 | 0.011433           |
| Santi  | 全量计算   | 1      | 31.884         | 62.87  | 0.159047           |
| Santi  | 缓存 100ms | 1      | 3.569          | 564.61 | 0.017711           |
| Nextjs | 全量计算   | 6      | 2.679          | 755.05 | 0.013244           |
| Santi  | 全量计算   | 6      | 19.419         | 103.37 | 0.096742           |
| Santi  | 缓存 100ms | 6      | 3.972          | 507.34 | 0.019711           |

#### 并发数 50

|        | 可用性     | 集群数 | 完成时间（秒） | QPS    | 平均响应时间（秒） |
| ------ | ---------- | ------ | -------------- | ------ | ------------------ |
| Nextjs | 全量计算   | 1      | 2.113          | 967.81 | 0.051663           |
| Santi  | 全量计算   | 1      | 30.899         | 65.04  | 0.768779           |
| Santi  | 缓存 100ms | 1      | 2.446          | 829.93 | 0.060246           |
| Nextjs | 全量计算   | 6      | 2.24           | 910.84 | 0.054894           |
| Santi  | 全量计算   | 6      | 12.956         | 155.70 | 0.321122           |
| Santi  | 缓存 100ms | 6      | 2.523          | 809.01 | 0.061804           |

#### 并发数 100

|        | 可用性     | 集群数 | 完成时间（秒） | QPS      | 平均响应时间（秒） |
| ------ | ---------- | ------ | -------------- | -------- | ------------------ |
| Nextjs | 全量计算   | 1      | 2.174          | 949.62   | 0.105305           |
| Santi  | 全量计算   | 1      | 31.02          | 65.08    | 1.536474           |
| Santi  | 缓存 100ms | 1      | 2.157          | 953.79   | 0.104845           |
| Nextjs | 全量计算   | 6      | 2.224          | 927.44   | 0.107824           |
| Santi  | 全量计算   | 6      | 11.975         | 170.42   | 0.586769           |
| Santi  | 缓存 100ms | 6      | 2.061          | 1,015.84 | 0.098441           |

#### 并发数 300

|        | 可用性     | 集群数 | 完成时间（秒） | QPS      | 平均响应时间（秒） |
| ------ | ---------- | ------ | -------------- | -------- | ------------------ |
| Nextjs | 全量计算   | 1      | 2.152          | 978.44   | 0.306611           |
| Santi  | 全量计算   | 1      | 30.409         | 68.90    | 4.354413           |
| Santi  | 缓存 100ms | 1      | 1.557          | 1,367.29 | 0.219412           |
| Nextjs | 全量计算   | 6      | 2.139          | 966.40   | 0.310432           |
| Santi  | 全量计算   | 6      | 12.361         | 195.62   | 1.533604           |
| Santi  | 缓存 100ms | 6      | 1.812          | 1,184.90 | 0.253185           |

#### 并发数 500

|        | 可用性     | 集群数 | 完成时间（秒） | QPS      | 平均响应时间（秒） |
| ------ | ---------- | ------ | -------------- | -------- | ------------------ |
| Nextjs | 全量计算   | 1      | 2.423          | 987.80   | 0.506178           |
| Santi  | 全量计算   | 1      | 31.313         | 70.84    | 7.058347           |
| Santi  | 缓存 100ms | 1      | 1.571          | 1,381.07 | 0.362038           |
| Nextjs | 全量计算   | 6      | 2.225          | 981.13   | 0.509618           |
| Santi  | 全量计算   | 6      | 10.724         | 212.19   | 2.356404           |
| Santi  | 缓存 100ms | 6      | 1.692          | 1,273.01 | 0.392771           |

#### 并发数 1000

|        | 可用性     | 集群数 | 完成时间（秒） | QPS      | 平均响应时间（秒） |
| ------ | ---------- | ------ | -------------- | -------- | ------------------ |
| Nextjs | 全量计算   | 1      | 2.197          | 993.31   | 1.006733           |
| Santi  | 全量计算   | 1      | 31.05          | 82.12    | 12.176888          |
| Santi  | 缓存 100ms | 1      | 1.497          | 1,572.22 | 0.636043           |
| Nextjs | 全量计算   | 6      | 2.184          | 1,015.39 | 0.984847           |
| Santi  | 全量计算   | 6      | 11.51          | 225.60   | 4.432673           |
| Santi  | 缓存 100ms | 6      | 1.591          | 1,495.70 | 0.668581           |
