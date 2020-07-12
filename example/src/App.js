import React, { useEffect } from 'react'
import { useState, getInitialProps, Ready } from 'santi'

const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))

function App({ prop }) {
  const [state, setState] = useState(`SSR: ${Math.random()}`)

  useEffect(() => {
    const inter = setInterval(async () => {
      setState(`CSR: ${Math.random()}`)
    }, 10000)

    return () => {
      clearInterval(inter)
    }
  }, [])

  return (
    <Ready.OnMount>
      <div>
        <p>打开开发者工具查看 document 返回以确认初始内容是由 SSR 生成</p>
        <p>Prop from {prop}</p>
        <p>State from {state}</p>
      </div>
    </Ready.OnMount>
  )
}

export default getInitialProps(async () => {
  await delay(60)

  return {
    prop: `SSR: ${Math.random()}`,
  }
})(App)
