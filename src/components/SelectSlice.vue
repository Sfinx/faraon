

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
// let scheduled = null
// let dataRoot = null

const onResize = () => Plotly.Plots.resize(plotly.value)

onMounted(() => {
  window.addEventListener('keydown', keyDown)
  window.addEventListener('keyup', keyUp)
  init()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', keyDown)
  window.removeEventListener('keyup', keyDown)
  deinit()
})

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
        // if (args[0] == 'afterplot')
        //   afterplot()
        // else
        //   console.log('*********** Not implemented: apply', ctx, args)
      }
    }
  }
  events.forEach(evt => plotly.value.on(evt.completeName, evt.handler(context)))
  if (!reinit) {
    setTimeout(() => refresh(), 100)
  }
}

const select = (s) => {
  if (keyModifier == 'Shift') {
    props.selected(s.points[0])
    return false
  }
}

const refresh = (newRoot) => {
  // logger.trace('refresh: selectedSliceId :' + selectedSliceId + ', newRoot: ' + newRoot)
  let level = (selectedSliceId == '1' ? undefined : selectedSliceId)
  if (newRoot) { // move back
    level = (newRoot == 1 ? undefined : selectedSliceId) // set to old root for now
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
          // dataRoot = s.key
        } else
           slices.parents.push(s.parent)
        slices.customdata.push({
          parent: s.parent,
          out_count: s.out_count
        })
        slices.values.push(1)
      }
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

// const setRootSlice = (root) => {
//   if (root == '')
//     root = '1'
//   if (data.value)
//     data.value = [{ ...data.value[0], ...{ level: root } }]
// }
//
// const afterplot = () => {
//   // if (data.value??[0]?.level != selectedSliceId)
//   //   setRootSlice(selectedSliceId)
// }

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
  // if (scheduled)
  //   return (scheduled.replot = scheduled.replot || context.replot)
  // scheduled = ctx
  // nextTick(() => {
  //   if (scheduled.replot)
  //     react()
  //   else
  //     // relayout(innerLayout)
  //     logger.error('No implemented: relayout(innerLayout)')
  //   scheduled = null
  // })
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

watch(data, (d, dprev) => {
  console.log('data watch')
  schedule({ replot: true })
})

watch(() => props.returnToDao, () => toDao())

//   watch: {
//     options: {
//       handler(value, old) {
//         if (JSON.stringify(value) === JSON.stringify(old)) {
//           return
//         }
//         this.schedule({ replot: true })
//       },
//       deep: true
//     },
//     layout(layout) {
//       this.innerLayout = { ...layout }
//       this.schedule({ replot: false })
//     },
//   }

</script>

<script>

export default {
  name: 'SelectSlice',
  inheritAttrs: false
}

</script>
