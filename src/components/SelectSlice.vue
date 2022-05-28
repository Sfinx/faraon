

<template>
  <div :id="id"  @select="select" @afterplot="afterPlot" v-resize:debounce.100="onResize" />
</template>

<script>

import Plotly from 'plotly.js/dist/plotly.js'
import events from './events'
import methods from './methods'
import { camelize } from './helper'
import vueResize from 'vue-resize-directive'
import logger from '@/logger'
import { useQuasar } from 'quasar'
import sfinx from '@/sfinx'

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

const defaultSunburstData = {
  type: 'sunburst', // sunburst icicle treemap
  outsidetextfont: { size: 20, color: '#377eb8' },
  leaf: { opacity: 1.0 },
  opacity: 1.0,
  hoverinfo: 'text',
  marker: {
    // autocolorscale: false,
    line: { width: 3 }
  },
  root: {
    color: '#e8c61a'
  }
}

let keyModifier = null
let $q

const keyDown = e => {
  keyModifier = e.key
}

const keyUp = e => {
  keyModifier = null
}

export default {
  name: 'SelectSlice',
  inheritAttrs: false,
  directives,
  props: {
    layout: {
      type: Object
    },
    selected: {
      type: Function
    },
    maxDepth: {
      type: Number
    },
    id: {
      type: String,
      required: false,
      default: null
    },
    returnToDao: {
      type: Number
    }
  },
  data() {
    return {
      data: [],
      scheduled: null,
      innerLayout: { ...this.layout },
      dataRoot: null,
      selectedSliceId: '1'
    }
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
    },
    returnToDao() {
      this.toDao()
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
  mounted() {
    $q = useQuasar()
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    this.init()
  },
  beforeUnmount() {
    window.removeEventListener('keydown', keyDown)
    window.removeEventListener('keyup', keyDown)
    this.deinit()
  },
  methods: {
    select(s) {
      if (keyModifier == 'Shift') {
        this.selected(s.points[0])
        return false
      }
    },
    toDao() {
      this.refresh('1')
    },
    setRootSlice(root) {
      if (root == '')
        root = '1'
      if (this.data) {
        this.data = [{ ...this.data[0], ...{ level: root } }]
      }
    },
    afterplot() {
      if (this.data[0].level != this.selectedSliceId)
        this.setRootSlice(this.selectedSliceId)
    },
    refresh(newRoot) {
      // logger.error('refresh: selectedSliceId :' + selectedSliceId + ', newRoot: ' + newRoot)
      let level = (this.selectedSliceId == '1' ? undefined : this.selectedSliceId)
      if (newRoot) { // move back
        level = (newRoot == 1 ? undefined : this.selectedSliceId) // set to old root for now
        this.selectedSliceId = newRoot
      }
      sfinx.sendMsg('GetSlices', res => {
        if (res.e)
          $q.notify('selectSlice: GetSlices: ' + res.e)
        else {
          let slices = {
            labels: [],
            hovertext: [],
            parents: [],
            ids: [],
            customdata: [],
            values: []
          }
          for (let s of res.d.slices) {
            slices.labels.push(s.name + ' [' + s.out_count + ']')
            slices.hovertext.push(s.name + (s.description ? (' (' + s.description + ')') : ''))
            slices.ids.push(s.key)
            if (!slices.parents.length) {
              slices.parents.push('')
              this.dataRoot = s.key
            } else
               slices.parents.push(s.parent)
            slices.customdata.push({
              parent: s.parent,
              out_count: s.out_count
            })
            slices.values.push(1)
          }
          this.data = [{ ...slices, ...defaultSunburstData, ...{ level } }]
        }
      }, {
           from: this.selectedSliceId,
           depth: this.maxDepth
      })
    },
    init(reinit) {
      Plotly.newPlot(this.$el, this.data, this.innerLayout, { ...def_options, ...this.options })
      events.forEach(evt => this.$el.on(evt.completeName, evt.handler(this)))
      if (!reinit) {
        setTimeout(() => this.refresh(), 100)
      }
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
    react() {
      if (this.data[0].level === undefined) {
        this.data[0].level = '1'
        this.deinit()
        this.init(true)
        return
      }
      Plotly.react(this.$el, this.data, this.innerLayout, { ...def_options, ...this.options })
    }
  } // methods
} // export default
</script>
