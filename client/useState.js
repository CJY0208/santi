import { useState as useReactState } from 'react'

import { run, debounce } from './helpers'
import { useSID } from './withSanti'
import store from './store'

const warningMissingKey = debounce(() => {
  if (window.__SSR__) {
    return
  }

  console.warn('You shouldn\'t use "santi.useState" outside a "withSanti"')
}, 32)

function useState(initialState, key) {
  const { getCountedSID } = useSID()
  const sid = key || run(getCountedSID)
  const [state, setState] = useReactState(() => {
    if (!sid) {
      warningMissingKey()
    }

    const [err, value] = store.get(sid, initialState)

    if (err) {
      console.error(err)
    }

    return value
  })

  return [
    state,
    getNextState => {
      const nextState = run(getNextState, undefined, state)

      store.set(sid, nextState)

      return setState(nextState)
    },
    sid
  ]
}

export default useState
