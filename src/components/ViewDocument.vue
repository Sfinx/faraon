
<template>
  <component :is="component" :data="props.document" v-if="component" />
</template>

<script setup>

import logger from '@/logger'
import { shallowRef, onMounted } from 'vue'

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

onMounted(() => {
  let type = props.document.type.charAt(0).toUpperCase() + props.document.type.slice(1)
  logger.trace('ViewDocument type:', type)
  import(`./View${type}.vue`).then(i => component.value = i.default)
})

</script>
