
<template>
  <component :is="component" :data="props.document" v-if="component" />
</template>

<script setup>

import logger from '@/logger'
import { shallowRef, onMounted } from 'vue'
import sfinx from '@/sfinx'

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

const component = shallowRef(null)
const emit = defineEmits(['error'])

onMounted(() => {
  let type = sfinx.getFullDocumentType(props.document)
  logger.trace('ViewDocument type:' + type)
  import(`./View${type}.vue`).then(i => component.value = i.default).catch(e => emit('error', e))
})

</script>
