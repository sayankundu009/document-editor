import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'

import List from './List.jsx'

export default ({ getItems, getItemLabel, getItemId }) => ({
  items: ({ query }) => {
    return getItems()
      .filter(item => getItemLabel(item).toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 5)
  },

  render: () => {
    let component
    let popup

    return {
      onStart: props => {
        component = new ReactRenderer(List, {
          props: {
            ...props,
            getItemLabel,
            getItemId,
          },
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props) {
        component.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup && popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup && popup[0].hide()

          return true
        }

        return component.ref?.onKeyDown(props)
      },

      onExit() {
        popup && popup[0].destroy()
        component &&component.destroy()
      },
    }
  },
})