
<template>
  <component ref="processDocumentRef" :is="component" :data="props.data" v-if="component"/>
</template>

<script setup>

import logger from '@/logger'
import { ref, shallowRef, onMounted } from 'vue'
import sfinx from '@/sfinx'

const processDocumentRef = ref(null)
const processDocument = () => processDocumentRef.value.process()
defineExpose({ processDocument })

const props = defineProps({
  data: {
    type: Object
  },
  type: {
    type: String
  },
  op: {
    type: String
  },
  id: {
    type: String,
    default: null,
    required: false
  }
})

const component = shallowRef(null)
const emit = defineEmits(['error'])

onMounted(() => {
  let type = sfinx.getFullDocumentType(props)
  // logger.trace('ProcessDocument type:' + type + ', op: ' + props.op)
  import(`./Process${props.op + type}.vue`).then(i => component.value = i.default).catch(e => emit('error', e))
})

</script>
