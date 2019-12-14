import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useState, getInitialProps, Snapshot } from 'santi'

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
    <Snapshot.OnMount>
      <div>
        Prop from SSR: {prop}
        State from SSR: {state}
      </div>
    </Snapshot.OnMount>
  )
})

ReactDOM.render(<App />, document.getElementById('root'))
