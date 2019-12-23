import React, { forwardRef, createContext, useContext, useMemo } from 'react'
import hoistStatics from 'hoist-non-react-statics'

import SidProvider from './components/SidProvider'

const context = createContext()
const { Provider } = context

function withSanti(Component) {
  function WrappedComponent({ forwardRef, __sid: sid, ...props }) {
    let count = 0
    const contextValue = useMemo(
      () => ({
        sid,
        getCountedSID: () => (sid ? `${sid}:${count++}` : undefined)
      }),
      [sid]
    )

    return (
      <Provider value={contextValue}>
        <Component {...props} ref={forwardRef} />
      </Provider>
    )
  }

  const ForwardedRefHOC = forwardRef((props, ref) => (
    <SidProvider>
      {sid => <WrappedComponent {...props} forwardedRef={ref} __sid={sid} />}
    </SidProvider>
  ))

  return hoistStatics(ForwardedRefHOC, WrappedComponent)
}

export function useSID() {
  return (
    useContext(context) || {
      sid: undefined,
      getCountedSID: () => undefined
    }
  )
}

export default withSanti
