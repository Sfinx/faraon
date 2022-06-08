
<template>
  <q-resize-observer @resize="resize" />
  <div :id="props.id" @redraw="redraw" />
</template>

<script setup>

import logger from '@/logger'
import { useQuasar } from 'quasar'
import { useAttrs, ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'

const $q = useQuasar()
const attrs = useAttrs()

const props = defineProps({
  document: {
    type: Object
  },
  id: {
    type: String,
    default: null,
    required: false
  }
})

const resize = () => {}

onMounted(() => {
  logger.error('*** Loaded default.vue')
})

onBeforeUnmount(() => {
})

</script>
