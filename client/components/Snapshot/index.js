import React, { useState, useEffect } from 'react'

import snapshot from '../../snapshot'

function Snapshot({ children, delay, when = false }) {
  useEffect(() => {
    if (when) {
      snapshot(delay)
    }
  }, [when])

  return children
}

function SnapshotOnMount({ children, delay }) {
  const [snapshotable, setSnapshotable] = useState(false)
  useEffect(() => {
    setSnapshotable(true)
  }, [])

  return (
    <Snapshot delay={delay} when={snapshotable}>
      {children}
    </Snapshot>
  )
}

Snapshot.OnMount = SnapshotOnMount

export default Snapshot
