

<template>
  <q-resize-observer @resize="resize"/>
  <div :id="id" ref="plotly" style="visibility: hidden"/>
</template>

<script setup>

import Plotly from 'plotly.js/dist/plotly.js'
import events from './events'
import { camelize } from './helper'
import logger from '@/logger'
import { useAttrs, ref, onMounted, onBeforeUnmount, computed, watch, nextTick, getCurrentInstance } from 'vue'

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
const props = defineProps({
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
  },
  click: {
    type: Function
  }
})

const emit = defineEmits(['afterplot', 'hover', 'unhover'])

let innerLayout = { ...props.layout }
const { emitsOptions } = getCurrentInstance()

let afterplots = 0

const init = (reinit) => {
  Plotly.newPlot(plotly.value, props.data, innerLayout, { ...def_options, ...options })
  let emitsEvents = []
  for (let e in emitsOptions)
    emitsEvents.push(e)
  let context = {
    $emit: {
      apply: (event, args) => {
        if ((event == 'afterplot') && (plotly.value.style.visibility == 'hidden'))
          plotly.value.style.visibility = 'visible'
        if (event == 'sunburstclick')
          return props.click(args[0])
        if (emitsEvents.includes(event))
          return emit(event, args[0])
      }
    }
  }
  events.forEach(evt => plotly.value.on(evt.completeName, evt.handler(context)))
}

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

const deinit = () => {
  events.forEach(event => plotly.value.removeAllListeners(event.completeName))
  Plotly.purge(plotly.value)
}

const validate = d => {
  let err = Plotly.validate(props.data, innerLayout)
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

watch(() => props.data, (d, dprev) => schedule({ replot: true }))

const resize = () => Plotly.Plots.resize(plotly.value)

const react = () => {
  if (props.data[0].level === undefined) {
    props.data[0].level = '1'
    deinit()
    init(true)
    return
  }
  Plotly.react(plotly.value, props.data, innerLayout, { ...def_options, ...options })
}

defineExpose({
  react,
  resize
})

onMounted(() => init())
onBeforeUnmount(() => deinit())

</script>
