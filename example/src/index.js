import React, { useEffect } from 'react'
import { useState, getInitialProps, Ready, render } from 'santi'

const delay = time => new Promise(resolve => setTimeout(resolve, time))

const App = getInitialProps(async () => {
  await delay(200)

  return {
    prop: `ssrProp ${Math.random()}`
  }
})(function App({ prop }) {
  const [state, setState] = useState(`ssrState ${Math.random()}`)

  useEffect(() => {
    const inter = setInterval(async () => {
      setState(`ssrState ${Math.random()}`)
    }, 3000)

    return () => {
      clearInterval(inter)
    }
  }, [])

  return (
    <Ready.OnMount>
      <div>
        Prop from SSR: {prop}
        State from SSR: {state}
      </div>
    </Ready.OnMount>
  )
})

render(<App />, document.getElementById('root'))
