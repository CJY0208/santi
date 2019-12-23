import React, { useState, forwardRef, useRef, useEffect } from 'react'
import hoistStatics from 'hoist-non-react-statics'

import { run } from './helpers'
import withSanti, { useSID } from './withSanti'
import store from './store'

const getInitialProps = (fetch, fallback = null, key) => Component => {
  function WrappedComponent({ forwardedRef, ...props }) {
    const [ready, setReady] = useState(false)
    const [ssrProps, setSsrProps] = useState({})
    const mounted = useRef(true)
    const { getCountedSID } = useSID()
    const sid = key || run(getCountedSID)

    useEffect(() => {
      async function init() {
        const [err, ssrProps] = await store.get(sid, () =>
          run(fetch, undefined, props)
        )

        if (err) {
          console.error('[getInitialProps error]', err)
          return
        }

        if (mounted.current && ssrProps) {
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
      run(fallback, undefined, props)
    )
  }

  const ForwardedRefHOC = forwardRef((props, ref) => (
    <WrappedComponent {...props} forwardedRef={ref} />
  ))

  return withSanti(hoistStatics(ForwardedRefHOC, WrappedComponent))
}

export default getInitialProps
