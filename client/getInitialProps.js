import React, { useState, forwardRef, useRef, useEffect } from 'react'
import hoistStatics from 'hoist-non-react-statics'

import { run } from './helpers'
import store from './store'

const getInitialProps = (key, fetch, fallback = null) => Component => {
  const getProps = props => store.get(key, () => run(fetch, undefined, props))

  function WrappedComponent({ forwardedRef, ...props }) {
    const [ready, setReady] = useState(false)
    const [ssrProps, setSsrProps] = useState({})
    const mounted = useRef(true)

    useEffect(() => {
      async function init() {
        const [err, ssrProps] = await run(getProps, undefined, props)

        if (err) {
          console.error(err)
          return
        }

        if (mounted.current) {
          setSsrProps(ssrProps)
          setReady(true)
        }
      }

      init()

      return () => {
        mounted.current = false
      }
    }, [])

    return ready ? (
      <Component {...{ ...props, ...ssrProps }} ref={forwardedRef} />
    ) : (
      run(fallback)
    )
  }

  const ForwardedRefHOC = forwardRef((props, ref) => (
    <WrappedComponent {...props} forwardedRef={ref} />
  ))

  return hoistStatics(ForwardedRefHOC, WrappedComponent)
}

export default getInitialProps
