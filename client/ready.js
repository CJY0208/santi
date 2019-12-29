import { delay } from './helpers'

const ready = async (delayMillisecond = -1) => {
  try {
    if (delayMillisecond && Number(delayMillisecond) >= 0) {
      await delay(delayMillisecond)
    }

    if (window.__SSR__ && !window.__SSRREADY__) {
      const script = document.createElement('script')
      script.innerHTML = 'window.__SSRREADY__=true'
      document.head.appendChild(script)
    }
    // ssr 阶段：通知 santi 可以采集页面内容
    // csr 阶段：通知 santi/render 已完成呈现
    document.dispatchEvent(new Event('ssr-ready'))
  } finally {
    // nothing
  }
}

export default ready
