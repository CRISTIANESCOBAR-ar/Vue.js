import tippy from 'tippy.js'

export default {
  mounted(el, binding) {
    const content = binding.value
    if (typeof content === 'string' && content.trim() !== '') {
      el._tippyInstance = tippy(el, {
        content,
        placement: 'top',
        animation: 'shift-away',
        theme: 'light-border',
        delay: [100, 0]
      })
    }
  },

  updated(el, binding) {
    const content = binding.value
    // If we have content, create or update instance
    if (typeof content === 'string' && content.trim() !== '') {
      if (el._tippyInstance) {
        try {
          el._tippyInstance.setContent(content)
        } catch {
          // If instance API differs, recreate
          el._tippyInstance.destroy()
          el._tippyInstance = tippy(el, {
            content,
            placement: 'top',
            animation: 'shift-away',
            theme: 'light-border',
            delay: [100, 0]
          })
        }
      } else {
        el._tippyInstance = tippy(el, {
          content,
          placement: 'top',
          animation: 'shift-away',
          theme: 'light-border',
          delay: [100, 0]
        })
      }
    } else {
      // If no content, destroy existing instance
      if (el._tippyInstance) {
        el._tippyInstance.destroy()
        delete el._tippyInstance
      }
    }
  },

  unmounted(el) {
    if (el._tippyInstance) {
      el._tippyInstance.destroy()
      delete el._tippyInstance
    }
  }
}
