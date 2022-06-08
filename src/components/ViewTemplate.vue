
<template>
  <div :id="props.id" />
</template>

<script setup>

import logger from '@/logger'
import { onMounted } from 'vue'

const props = defineProps({
  data: {
    type: Object
  },
  id: {
    type: String,
    default: null,
    required: false
  }
})

onMounted(() => {
  logger.trace('ViewTemlate data:' + logger.json(props.data))
})

</script>
