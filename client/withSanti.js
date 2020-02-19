import React, { forwardRef, createContext, useContext, useMemo } from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { NodeKey } from 'react-activation'

const context = createContext()
const { Provider } = context

function withSanti(Component) {
  function WrappedComponent({ forwardRef, __key: nodeKey, ...props }) {
    let count = 0
    const contextValue = useMemo(
      () => ({
        nodeKey,
        getCountedKey: () => (nodeKey ? `${nodeKey}:${count++}` : undefined)
      }),
      [nodeKey]
    )

    return (
      <Provider value={contextValue}>
        <Component {...props} ref={forwardRef} />
      </Provider>
    )
  }

  const ForwardedRefHOC = forwardRef((props, ref) => (
    <NodeKey>
      {nodeKey => (
        <WrappedComponent {...props} forwardedRef={ref} __key={nodeKey} />
      )}
    </NodeKey>
  ))

  return hoistStatics(ForwardedRefHOC, WrappedComponent)
}

export function useNodeKey() {
  return (
    useContext(context) || {
      nodeKey: undefined,
      getCountedKey: () => undefined
    }
  )
}

export function useSID() {
  const { nodeKey: sid, getCountedKey: getCountedSID } = useNodeKey()
  return { sid, getCountedSID }
}

export default withSanti
