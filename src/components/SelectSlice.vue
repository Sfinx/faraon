

<template>
  <q-resize-observer @resize="onResize" />
  <div :id="props.id" ref="plotly" @select="select" />
</template>

<script setup>

import Plotly from 'plotly.js/dist/plotly.js'
import events from './events'
import methods from './methods'
import { camelize } from './helper'
import logger from '@/logger'
import { useQuasar } from 'quasar'
import sfinx from '@/sfinx'
import { useAttrs, ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'

let keyModifier = null
const keyDown = e => keyModifier = e.key
const keyUp = e => keyModifier = null

const $q = useQuasar()
const attrs = useAttrs()

const plotly = ref(null)
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

const props = defineProps({
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
    default: null,
    required: false
  },
  returnToDao: {
    type: Number
  }
})

const data = ref([])
let innerLayout = { ...props.layout }
let selectedSliceId = '1'

const options = computed(() => {
  const optionsFromAttrs = Object.keys(attrs).reduce((acc, key) => {
    acc[camelize(key)] = attrs[key]
    return acc
  }, {})
  return {
    ...def_options,
    ...optionsFromAttrs
  }
})

const init = (reinit) => {
  Plotly.newPlot(plotly.value, data.value, innerLayout, { ...def_options, ...options })
  let context = {
    select,
    $emit: {
      apply: (ctx, args) => {
        if ((args[0] == 'afterplot') && (plotly.value.style.visibility == 'hidden'))
          setTimeout(() => plotly.value.style.visibility = 'visible', 200) // remove flickering
      }
    }
  }
  events.forEach(evt => plotly.value.on(evt.completeName, evt.handler(context)))
  if (!reinit) {
    setTimeout(() => refresh(), 100)
  }
}

let dataRoot

const select = (e) => {
  let p = e?.points??[0]
  if (!p)
    return true
  if (keyModifier == 'Shift') {
    props.selected(p[0])
    return false
  } else {
    // console.log('click: selectedSliceId: ', p, ', dataRoot: ', dataRoot)
    selectedSliceId =  p[0].id
    if (selectedSliceId != '1') {
      if (selectedSliceId == dataRoot) { // back to parent
        // logger.trace('Back to parent: ' + p[0].customdata.parent)
        refresh(p[0].customdata.parent)
        return false
      }
      if (p[0].customdata.out_count) { // move forward by DB
        // logger.trace('Move forward')
        refresh()
        return false
     }
    }
  }
  return true
}

const refresh = (newRoot) => {
  // logger.trace('refresh: selectedSliceId :' + selectedSliceId + ', newRoot: ' + newRoot)
  let level = (selectedSliceId == '1' ? undefined : selectedSliceId)
  if (newRoot) { // move back
    level = (newRoot == '1' ? undefined : selectedSliceId) // set to old root for now
    selectedSliceId = newRoot
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
        slices.labels.push(s.name + sfinx.sliceSeparator + s.out_count)
        slices.hovertext.push(s.name + (s.description ? (' (' + s.description + ')') : ''))
        slices.ids.push(s.key)
        if (!slices.parents.length) {
          slices.parents.push('')
          dataRoot = s.key
        } else
           slices.parents.push(s.parent)
        slices.customdata.push({
          parent: s.parent,
          out_count: s.out_count
        })
        slices.values.push(1)
      }
      if (level && (level != selectedSliceId))
        level = selectedSliceId
      data.value = [{ ...slices, ...defaultSunburstData, ...{ level } }]
    }
  }, {
       from: selectedSliceId,
       depth: props.maxDepth
  })
}

const deinit = () => {
  events.forEach(event => plotly.value.removeAllListeners(event.completeName))
  Plotly.purge(plotly.value)
}

const toDao = () => refresh('1')

const validate = (d) => {
  let err = Plotly.validate(data.value, innerLayout)
  if (err) {
    logger.error('*** Plotly.validate failed')
    console.log('*** Validate error:', err)
  }
}

const schedule = (ctx) => {
  if (ctx.replot)
    nextTick(() => {
      react()
    })
}

const react = () => {
  if (data.value[0].level === undefined) {
    data.value[0].level = '1'
    deinit()
    init(true)
    return
  }
  Plotly.react(plotly.value, data.value, innerLayout, { ...def_options, ...options })
}

watch(data, (d, dprev) => schedule({ replot: true }))
watch(() => props.returnToDao, () => toDao())
const onResize = () => Plotly.Plots.resize(plotly.value)

onMounted(() => {
  window.addEventListener('keydown', keyDown)
  window.addEventListener('keyup', keyUp)
  plotly.value.style.visibility = 'hidden'
  init()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', keyDown)
  window.removeEventListener('keyup', keyDown)
  deinit()
})

</script>

<script>

export default {
  name: 'SelectSlice',
  inheritAttrs: false
}

</script>
