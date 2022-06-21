
<template>
  <q-card-section v-if="shown" class="items-center" style="width: 40vw">
    <q-input v-model="props.data.document.name" outlined label-color="black" label="File Name" ref="fileNameRef" @keydown.enter.prfile="fileDescriptionRef.focus()" class="q-mb-sm"/>
    <q-input v-model="props.data.document.description" outlined label-color="black" label="File Description" ref="fileDescriptionRef"/>
    <div class="row justify-between">
      <q-file v-if="props.data.document.uploaded.on" style="width: 40%" class="q-mt-sm" outlined v-model="file" label="Select File" />
      <q-input style="width: 40%" class="q-mt-sm" v-if="!props.data.document.uploaded.on" v-model="props.data.document.url" outlined label-color="black" label="File Path / URL"/>
      <q-input style="width: 40%" class="q-mt-sm" v-model="props.data.document.mime" outlined label-color="black" label="File Type">
        <q-tooltip anchor="top right" :offset="[30, 30]" >{{ sfinx.getFileTypeCategory(props.data.document.mime) }}</q-tooltip>
      </q-input>
      <q-checkbox class="q-mt-sm dense" v-model="props.data.document.uploaded.on" label="Upload"/>
    </div>
  </q-card-section>
</template>

<script setup>

import logger from '@/logger'
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import sfinx from '@/sfinx'
import Progress from '@/components/Progress.vue'

const $q = useQuasar()

const file = ref(null)
const fileNameRef = ref(null)
const fileDescriptionRef = ref(null)
const shown = ref(false)
const upload = ref(null)
let fileChanged = false

watch(file, file => {
  props.data.document.name = file.name
  props.data.document.mime = file.type
  fileChanged = true
})

const uploadPauseResume = (paused) => {
  if (paused)
    sfinx.uploadPause(upload.value, () => $q.$notify('Upload paused'))
  else
    sfinx.uploadResume(upload.value, (resumed) => $q.$notify(resumed ? 'Resuming previous upload' : 'Starting new upload'))
}

const startUpload = async () => {
  upload.value = await sfinx.uploadFile(file.value, (e, progress, done) => {
    if (e)
      $q.$notify(e)
    if (progress && props.data.document.uploaded.on)
      uploadDialog.update({
        title: props.data.document.name,
        progress: parseFloat(progress)
      })
    if (done)
      logger.debug('file:' + file.value.name + ' uploaded ok in ' + done + ' seconds')
    if (e || done) {
      let file = { type: 'file', ...props.data.document }
      if (props.data.document.uploaded.on) {
        file.uploaded.name = upload.value.url.substring(upload.value.url.lastIndexOf('/') + 1)
        setTimeout(() => upload.value = null, 20)
        uploadDialog.hide()
      }
      emit('done', file)
    }
  })
}

const props = defineProps({
  data: {
    type: Object
  }
})

const getDefaults = () => {
  return {
    name: '',
    description: '',
    uploaded: {
      on: true,
      name: ''
    },
    url: '',
    mime: 'other'
  }
}

onMounted(() => {
  if (!props.data.edit)
    props.data.document = getDefaults()
  shown.value = true
  setTimeout(() => fileNameRef.value.focus(), 10)
})

const emit = defineEmits(['done'])

let uploadDialog


const process = () => {
  // logger.trace('newOrEditFile: process: ' + logger.json(file))
  if (props.data.document.uploaded.on && file.value && fileChanged) {
    uploadDialog = $q.dialog({
      component: Progress,
      componentProps: {
        title: props.data.document.name,
        progress: 0,
        pause: uploadPauseResume
      }
    }).onCancel(() => {
      if (upload.value) {
        sfinx.uploadPause(upload.value, () => $q.$notify('Upload canceled'), true)
        emit('done', null)
      }
    })
    startUpload()
  } else {
    let file = { type: 'file', ...props.data.document }
    emit('done', file)
  }
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
