import { Component } from 'react'

import { run } from '../../helpers'

import getKeyByFiberNode from './getKeyByFiberNode'
import getKeyByPreactNode from './getKeyByPreactNode'

let baseType

// 根据 Node 所处位置来确定 ID
export default class IdProvider extends Component {
  id = null
  genId = () => {
    if (!baseType) {
      if (this._reactInternalFiber) {
        baseType = 'React'
      }

      // FIXME: Maybe "preact/compat" mode only, not verified yet.
      if (this.__v) {
        baseType = 'Preact'
      }
    }

    switch (baseType) {
      case 'Preact': {
        this.id = getKeyByPreactNode(this.__v)
        break
      }
      case 'React': {
        this.id = getKeyByFiberNode(this._reactInternalFiber)
        break
      }
      default: {
        break
      }
    }

    return this.id
  }

  render() {
    const { children, prefix = '' } = this.props

    return run(children, undefined, `${prefix}${this.id || this.genId()}`)
  }
}
