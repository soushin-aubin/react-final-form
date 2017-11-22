// @flow
import * as React from 'react'
import warning from './warning'
import PropTypes from 'prop-types'
import { fieldSubscriptionItems } from 'final-form'
import diffSubscription from './diffSubscription'
import type { FieldSubscription, FieldState } from 'final-form'
import type { FieldProps as Props, ReactContext } from './types'
import renderComponent from './renderComponent'

const all: FieldSubscription = fieldSubscriptionItems.reduce((result, key) => {
  result[key] = true
  return result
}, {})

export default class Field extends React.PureComponent<Props, FieldState> {
  context: ReactContext
  props: Props
  state: FieldState
  unsubscribe: () => void

  constructor(props: Props, context: ReactContext) {
    super(props, context)
    const { name, subscription } = props
    let initialState
    warning(
      context.reactFinalForm,
      'Field must be used inside of a Form component'
    )
    if (this.context.reactFinalForm) {
      // avoid error, warning will alert developer to their mistake
      this.unsubscribe = this.context.reactFinalForm.registerField(
        name,
        (state: FieldState) => {
          if (initialState) {
            this.notify(state)
          } else {
            initialState = state
          }
        },
        subscription || all
      )
    }
    this.state = initialState || {}
  }

  notify = (state: FieldState) => this.setState(state)

  componentWillReceiveProps(nextProps: Props) {
    const { name, subscription } = nextProps
    if (
      this.props.name !== name ||
      diffSubscription(
        this.props.subscription,
        subscription,
        fieldSubscriptionItems
      )
    ) {
      if (this.context.reactFinalForm) {
        // avoid error, warning will alert developer to their mistake
        this.unsubscribe()
        this.unsubscribe = this.context.reactFinalForm.registerField(
          name,
          this.notify,
          subscription || all
        )
      }
    }
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  handlers = {
    onBlur: (event: ?SyntheticFocusEvent<*>) => {
      this.state.blur()
    },
    onChange: (event: SyntheticInputEvent<*> | any) => {
      const value: any =
        event && event.target
          ? (event: SyntheticInputEvent<*>).target.value
          : event
      this.state.change(value === '' ? undefined : value)
    },
    onFocus: (event: ?SyntheticFocusEvent<*>) => {
      this.state.focus()
    }
  }

  render() {
    const { name, component, children, allowNull, ...rest } = this.props
    let { blur, change, focus, value, ...meta } = this.state
    if (value === undefined || (value === null && !allowNull)) {
      value = ''
    }
    const input = { name, value, ...this.handlers }
    if (typeof children === 'function') {
      return (children: Function)({ input, meta, ...rest })
    }

    if (typeof component === 'string') {
      // ignore meta, combine input with any other props
      return React.createElement(component, { ...input, children, ...rest })
    }
    return renderComponent({ input, meta, children, ...rest }, `Field(${name})`)
  }
}

Field.contextTypes = {
  reactFinalForm: PropTypes.object
}