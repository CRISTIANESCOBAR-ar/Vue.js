import tippy from 'tippy.js'

export default {
  mounted(el, binding) {
    tippy(el, {
      content: binding.value,
      placement: 'top',
      animation: 'shift-away',
      theme: 'light-border',
      delay: [100, 0],
    })
  }
}