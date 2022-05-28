
<template>
  <div :id="id" v-resize:debounce.100="onResize" />
</template>
<script>

import Plotly from 'plotly.js/dist/plotly.js'
import events from './events'
import methods from './methods'
import { camelize } from './helper'
import vueResize from 'vue-resize-directive'
import logger from '@/logger'

const directives = {}

if (typeof window !== 'undefined')
  directives.resize = vueResize

const def_options = {
  locale: 'ru',
  displaylogo: false,
  autosizable: true,
  responsive: true,
  scrollZoom: true,
  logging: 2,
  modeBarButtonsToRemove: ['toImage']
}

export default {
  name: 'Plotly',
  inheritAttrs: false,
  directives,
  props: {
    data: {
      type: Array
    },
    layout: {
      type: Object
    },
    id: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      scheduled: null,
      innerLayout: { ...this.layout }
    }
  },
  mounted() {
    this.init()
  },
  watch: {
    data: {
      handler() {
        this.schedule({ replot: true })
      },
      deep: true
    },
    options: {
      handler(value, old) {
        if (JSON.stringify(value) === JSON.stringify(old)) {
          return
        }
        this.schedule({ replot: true })
      },
      deep: true
    },
    layout(layout) {
      this.innerLayout = { ...layout }
      this.schedule({ replot: false })
    }
  },
  computed: {
    options() {
      const optionsFromAttrs = Object.keys(this.$attrs).reduce((acc, key) => {
        acc[camelize(key)] = this.$attrs[key]
        return acc
      }, {})
      return {
        ...def_options,
        ...optionsFromAttrs
      }
    }
  },
  beforeUnmount() {
    this.deinit()
  },
  methods: {
    init() {
      // this.validate(this.data)
      Plotly.newPlot(this.$el, this.data, this.innerLayout, { ...def_options, ...this.options })
      events.forEach(evt => {
        this.$el.on(evt.completeName, evt.handler(this))
      })
    },
    deinit() {
      events.forEach(event => this.$el.removeAllListeners(event.completeName))
      Plotly.purge(this.$el)
    },
    ...methods,
    validate(d) {
      let err = Plotly.validate(this.data, this.innerLayout)
      if (err) {
        logger.error('*** Plotly.validate failed')
        console.log('*** Validate error:', err)
      }
    },
    onResize() {
      Plotly.Plots.resize(this.$el)
    },
    schedule(context) {
      const { scheduled } = this
      if (scheduled) {
        scheduled.replot = scheduled.replot || context.replot
        return
      }
      this.scheduled = context
      this.$nextTick(() => {
        const {
          scheduled: { replot }
        } = this
        this.scheduled = null
        if (replot) {
          this.react()
          return
        }
        this.relayout(this.innerLayout)
      })
    },
    toImage(options) {
      const allOptions = Object.assign(this.getPrintOptions(), options)
      return Plotly.toImage(this.$el, allOptions)
    },
    downloadImage(options) {
      const filename = `plot--${new Date().toISOString()}`
      const allOptions = Object.assign(this.getPrintOptions(), { filename }, options)
      return Plotly.downloadImage(this.$el, allOptions)
    },
    getPrintOptions() {
      const { $el } = this
      return {
        format: 'png',
        width: $el.clientWidth,
        height: $el.clientHeight
      }
    },
    react() {
      if (this.data[0].level === undefined) {
        this.data[0].level = '1'
        this.deinit()
        this.init()
        return
      }
      // this.validate(this.data)
      Plotly.react(this.$el, this.data, this.innerLayout, { ...def_options, ...this.options })
    }
  }
}
</script>
