
<template>
  <q-card-section v-if="shown" class="items-center" style="width: 40vw">
    <q-input v-model="props.data.document.name" outlined label-color="black" label="File Name" ref="fileNameRef" @keydown.enter.prfile="fileDescriptionRef.focus()" class="q-mb-sm"/>
    <q-input v-model="props.data.document.description" outlined label-color="black" label="File Description" ref="fileDescriptionRef"/>
  </q-card-section>
</template>

<script setup>

import logger from '@/logger'
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const fileNameRef = ref(null)
const fileDescriptionRef = ref(null)
const shown = ref(false)

const props = defineProps({
  data: {
    type: Object
  }
})

const getDefaults = () => {
  return {
    name: '',
    description: '',
    upload: false,
    path: '',
    set: false,
    type: 'other'
  }
}

onMounted(() => {
  if (!props.data.edit)
    props.data.document = getDefaults()
  shown.value = true
  setTimeout(() => fileNameRef.value.focus(), 10)
})

const emit = defineEmits(['done'])

const process = () => {
  let file = { type: 'file', ...props.data.document }
  // logger.trace('newOrEditFile: process: ' + logger.json(file))
  emit('done', file)
}

defineExpose({
  process
})

</script>

<style scoped>

.q-card__section--vert {
  padding: 3px;
}

.nospins :deep(input[type="number"]) {
  -moz-appearance: textfield;
}

.nospins :deep(input::-webkit-outer-spin-button),
.nospins :deep(input::-webkit-inner-spin-button) {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

</style>
