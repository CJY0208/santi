import { run } from '../../helpers'

function NoSSR({ children, fallback = null }) {
  return window.__SSR__ ? run(fallback) : children
}

export default NoSSR
