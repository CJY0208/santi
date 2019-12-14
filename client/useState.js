import { useState as useReactState } from 'react'

import store from './store'

function useState(key, initialState) {
  const [state, setState] = useReactState(() => {
    const [err, value] = store.get(key, initialState)

    if (err) {
      console.error(err)
    }

    return value
  })

  return [state, setState]
}

export default useState
