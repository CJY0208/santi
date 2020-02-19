import { useState as useReactState } from 'react'

import { run, debounce } from './helpers'
import { useNodeKey } from './withSanti'
import store from './store'

const warningMissingKey = debounce(() => {
  if (window.__SSR__) {
    return
  }

  console.warn('You shouldn\'t use "santi.useState" outside a "withSanti"')
}, 32)

function useState(initialState, key) {
  const { getCountedKey } = useNodeKey()
  const nodeKey = key || run(getCountedKey)
  const [state, setState] = useReactState(() => {
    if (!nodeKey) {
      warningMissingKey()
    }

    const [err, value] = store.get(nodeKey, initialState)

    if (err) {
      console.error(err)
    }

    return value
  })

  return [
    state,
    getNextState => {
      const nextState = run(getNextState, undefined, state)

      store.set(nodeKey, nextState)

      return setState(nextState)
    },
    nodeKey
  ]
}

export default useState
