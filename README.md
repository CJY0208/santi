# Santi

基于 [create-react-app](https://create-react-app.dev/) 和 [jsdom](https://github.com/jsdom/jsdom) 的同构方案，SPA/预渲染/SSR 三位一体

SSR 功能基于 jsdom，每次渲染需启动 jsdom 沙盒，相对于 React 官方 renderToString 方案存在较大性能差异，因此使用 santi 时需要考虑使用[缓存控制](#config)

目前主要针对低并发高可用性或高并发低可用性等低计算量场景

具体可参考[压测表现](#benchmark)

---

## 特性

- [x] 自动内联关键样式，更快呈现首屏（[对比 Nextjs](#fpspeed)）
- [x] SSR 无需关注服务端 / 客户端差异
- [x] SSR 使用沙盒渲染，无需关注同构时的内存泄漏问题
- [x] SPA、预渲染、SSR 功能渐进式开启或关闭
- [x] 性能良好（搭配合理的缓存，单核心 500QPS + 20ms/AVG 响应）
- [x] SSR 页面级缓存，自由控制
- [ ] SSR 组件级缓存
- [ ] SSR 分片支持

---

## 兼容性

React v16.8.0+

Preact v10+

需要 Hooks 支持

node v8+

需要 async/await 语法支持

---

## 起步

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
   + "config-overrides-path": "node_modules/santi/config",
     ...
   }
   ```

3. 使用 `santi.render` 替代 `ReactDOM.render`

   ```diff
   - import { render } from 'react-dom
   + import { render } from 'santi'

   render(<App />, document.getElementById('root'))
   ```

---

## 主动声明渲染完成

santi 中，每一次 SSR 并不会像 nextjs 那样会在 getInitialProps 后自动完成，需要触发一个自定义事件 `ssr-ready` 来通知 jsdom 完成了渲染

若一次 SSR 渲染迟迟未收到 `ssr-ready` 事件，则默认在 1000ms 后强制采集结果并返回，超时时间可在[配置文件](#config)中的 ssr.timeout 项更改

```js
document.dispatchEvent(new Event('ssr-ready'))
```

这样做可以自由地确定完成 ssr 渲染的时机，以实现一些有趣的功能，例如让 ssr 允许处理异步载入的模块

在 santi 中，可以不需要手动触发这个自定义事件，触发过程被封装为了一些直接可用的方法：

- api 形式的 ready 方法，它可以延迟触发
- 组件形式的 Ready 组件，以及在组件 onMount 后立即发起 ready 的 Ready.OnMount 组件

  ```jsx
  import { ready, Ready } from 'santi'

  ready() // 立即触发 ssr-ready 事件
  ready(1000) // 1s 后触发 ssr-ready 事件

  function TestReady() {
    const [ready, setReady] = useState(false)

    useEffect(() => {
      doSomething.then(() => {
        setReady(true)
      })
    }, [])

    return <Ready when={ready}>...</Ready>
  }

  function TestReadyOnMount() {
    return <Ready.OnMount>...</Ready.OnMount>
  }
  ```

---

## 在服务端准备数据

### useState

santi 允许使用 hook 方式的 `santi.useState` 方法来初始化服务端数据，这个 hook 将会在 ssr 阶段触发，并同步到 csr 阶段，csr 阶段初始化时直接使用 ssr 阶段获得的数据

一般情况下，为了让 ssr 阶段的数据和 csr 阶段可以一一对应，需要给 useState 一个 key 值，用来做两侧数据的交接

```jsx
import { useState, Ready } from 'santi'

function App() {
  const [value, setValue] = useState(undefined, 'App_ssrState')
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    doSomeAsyncWork().then(value => {
      setValue(value)
      setReady(true)
    })
  }, [])

  return <Ready when={ready}>State from SSR: {value}</Ready>
}
```

如果不希望主动声明这个 key 值，可以使用 withSanti HOC 包裹组件

```jsx
import { withSanti, useState, Ready } from 'santi'

const App = withSanti(function App() {
  const [random, setRandom] = useState(Math.random())

  return <Ready.OnMount>State from SSR: {random}</Ready.OnMount>
})
```

### getInitialProps

santi 也允许类似于 nextjs 中 getInitialProps 的操作，让数据在服务端就准备好，但使用方式上于 nextjs 有所不同

santi 中的 getInitialProps 使用的是 HOC 形式，渲染方式类似于 React.Suspence，将在异步任务完成后才加载组件，因此可以配合 Ready.OnMount 使用

getInitialProps 中包含了 withSanti 功能，因此其内部使用 santi.useState 不需要声明 key 值

```jsx
import { getInitialProps, Ready } from 'santi'

const delay = time => new Promise(resolve => setTimeout(resolve, time))

const App = getInitialProps(async () => {
  await delay(200) // 模拟异步任务延时

  return {
    random: `ssrProp ${Math.random()}`
  }
})(function App({ random }) {
  return <Ready.OnMount>Prop from SSR: {random}</Ready.OnMount>
})
```

---

## <div id="config" /> Santi 配置（页面缓存配置）

合法的 santi 配置文件为以下路径

- santi.config.js 或 santi.config.ts
- .santirc.js 或 .santirc.ts
- config/index.js 或 config/index.ts

配置文件内容如下

```js
const { addWebpackAlias } = require('customize-cra')

module.exports = {
  mode: 'ssr' // santi 模式，可选值为 'csr' | 'ssr'

  prerender: ['/', '/list'] // 构建阶段需要预渲染的路由

  ssr: {
    timeout: 1000, // 每个 ssr 任务等待 ssr-ready 的最长超时时间
    renderConfig: [ // 每个渲染请求的行为配置，如缓存等
      [
        // 使用 micromatch 进行路径匹配
        // https://github.com/micromatch/micromatch
        ['/', '/?**'],
        req => ({
          key: `${req.path}:${req.cookie.uid}`, // 缓存将受 cookie 中 uid 影响，不同 uid 缓存不同
          cache: {
            maxAge: 1000 // 每次对 / 路由的请求都将缓存 1s
          }
        })
      ],
      [
        '/list',
        {
          key: '/list',
          timeout: 2000, // 单独配置该请求的 ssr-ready 超时
          cache: true // 仅渲染一次后长期缓存
        }
      ],
      [
        '**', // 默认渲染配置
        {
          ssr: false // 不使用 ssr
        }
      ]
    ],
    cacheEngine: { // 可选自定义缓存引擎，接入 redis 缓存等，默认为 lru-cache 内存缓存
      get(key) {...},
      set(key, value maxAge) {...}
    }
  },

  // 代理部分参考 http-proxy-middleware
  // https://github.com/chimurai/http-proxy-middleware
  proxy: {
    '/api': 'http://www.somewhere.com'
  }

  // 基于 create-react-app，并使用 react-app-rewired 和 customize-cra 进行无 inject 定制 webpack
  // https://github.com/timarney/react-app-rewired
  // https://github.com/arackaf/customize-cra
  // webpack 部分对应 customize-cra 中的 override 函数
  webpack: [
    addWebpackAlias({
      // 使用 preact 代替 react
      // https://preactjs.com/guide/v10/switching-to-preact
      react: 'preact/compat',
      'react-dom': 'preact/compat'
    })
  ],

  // webpack 部分对应 customize-cra 中的 overrideDevServer 函数
  devServer: []
}
```

## TODO

- [x] ~~useState~~
- [x] ~~getInitialProps~~
- [x] ~~SSR 页面级缓存~~
- [ ] SSR 组件级缓存
- [ ] SSR 分片支持

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
