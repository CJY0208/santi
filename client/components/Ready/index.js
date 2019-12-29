import React, { useState, useEffect } from 'react'

import ready from '../../ready'

function Ready({ children, delay, when = false }) {
  useEffect(() => {
    if (when) {
      ready(delay)
    }
  }, [when])

  return children
}

function ReadyOnMount({ children, delay }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])

  return (
    <Ready delay={delay} when={ready}>
      {children}
    </Ready>
  )
}

Ready.OnMount = ReadyOnMount

export default Ready
