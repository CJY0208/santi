import ReactDOM from 'react-dom'

import { isFunction } from './helpers'

const ROOT_KEY = 'ssr-root'

function render(element, container, callback) {
  // ssr 阶段将内容渲染至动态生成的 ssr-root 节点中
  if (window.__SSR__) {
    let ssrRoot = document.getElementById(ROOT_KEY)
    if (!ssrRoot) {
      ssrRoot = document.createElement('div')
      ssrRoot.id = ROOT_KEY
      document.body.insertBefore(ssrRoot, container)
    }
    return ReactDOM.render(element, ssrRoot, callback)
  }

  // csr 阶段若为 ssr 渲染结果，则在 csr 完成后替换 ssr 结果
  // 注：不使用水合操作（ReactDOM.hydrate）因为可能造成节点错误问题
  if (window.__SSRED__) {
    const ssrRoot = document.getElementById(ROOT_KEY)
    let renderCallback = callback

    container.style.display = 'none'
    container.innerHTML = ssrRoot.innerHTML

    function display() {
      // 做一定延时，尽可能保证平滑呈现
      setTimeout(() => {
        const ssrRoot = document.getElementById(ROOT_KEY)
        if (ssrRoot) {
          try {
            ssrRoot.parentNode.removeChild(ssrRoot)
          } finally {
            // nothing
          }
        }
        container.style.display = ''
      }, 56)
    }

    // 若为快照 ssr 则 csr 阶段将同样收到 snapshotable 事件，在此事件后平滑呈现真实可用交互
    if (window.__SNAPSHOTED__) {
      function onSnapshotable() {
        display()
        document.removeEventListener('snapshotable', onSnapshotable)
      }
      document.addEventListener('snapshotable', onSnapshotable)
    } else {
      // 若不为快照 ssr（一般为超时自动快照），则在 render 回调结束后呈现真实结果
      renderCallback = function(...args) {
        // FIXME: 超时快照可能造成呈现不平滑，具体表现为 SSR 切到真实内容过程中有轻微空屏现象，通俗为 “闪一下”，此问题待完美修正
        display()

        if (isFunction(callback)) {
          callback.apply(this, args)
        }
      }
    }

    return ReactDOM.render(element, container, renderCallback)
  }

  // csr 若不为 ssr 渲染结果则正常渲染
  return ReactDOM.render(element, container, callback)
}

export default render
