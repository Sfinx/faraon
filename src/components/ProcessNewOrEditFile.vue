
<template>
  <q-card-section v-if="shown" class="items-center" style="width: 40vw">
    <q-input v-model="props.data.document.data.name" outlined label-color="black" label="File Name" ref="fileNameRef" @keydown.enter.prfile="fileDescriptionRef.focus()" class="q-mb-sm"/>
    <q-input v-model="props.data.document.data.description" outlined label-color="black" label="File Description" ref="fileDescriptionRef"/>
    <div class="row justify-between">
      <q-file v-if="props.data.document.data.uploaded.on" style="width: 40%" class="q-mt-sm" outlined v-model="file" label="Select File" />
      <q-input style="width: 40%" class="q-mt-sm" v-else v-model="props.data.document.data.url" outlined label-color="black" label="File Path / URL"/>
      <q-input style="width: 40%" class="q-mt-sm" v-model="props.data.document.data.mime" outlined label-color="black" label="File Type">
        <q-tooltip anchor="top right" :offset="[30, 30]" >{{ sfinx.getFileTypeCategory(props.data.document.data.mime) }}</q-tooltip>
      </q-input>
      <q-checkbox class="q-mt-sm dense" v-model="props.data.document.data.uploaded.on" label="Upload"/>
    </div>
  </q-card-section>
</template>

<script setup>

import logger from '@/logger'
import { ref, onMounted, watch, defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
import sfinx from '@/sfinx'
const Progress = defineAsyncComponent(() => import('@/components/Progress.vue'))

const $q = useQuasar()

const file = ref(null)
const fileNameRef = ref(null)
const fileDescriptionRef = ref(null)
const shown = ref(false)
const upload = ref(null)
let fileChanged = false

watch(file, file => {
  props.data.document.data.name = file.name
  props.data.document.data.mime = file.type
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
    let close = () => {
      setTimeout(() => upload.value = null, 20)
      uploadDialog.hide()
    }
    if (e) {
      $q.$enotify(e)
      close()
    }
    if (progress && props.data.document.data.uploaded.on)
      uploadDialog.update({
        title: props.data.document.data.name,
        progress: parseFloat(progress)
      })
    if (done) {
      logger.debug('file:' + file.value.name + ' uploaded ok in ' + done + ' seconds')
      if (props.data.document.data.uploaded.on) {
        props.data.document.data.uploaded.name = upload.value.url.substring(upload.value.url.lastIndexOf('/') + 1)
        close()
      }
      props.data.document.data.csum = file.value.csum
      emit('done', props.data.document)
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
    props.data.document = { data: getDefaults() }
  shown.value = true
  setTimeout(() => fileNameRef.value.focus(), 10)
})

const emit = defineEmits(['done'])

let uploadDialog


const process = async () => {
  // logger.trace('newOrEditFile: process: ' + logger.json(file))
  if (props.data.document.data.uploaded.on && file.value && fileChanged) {
    $q.loading.show({ message: 'Calculating ' + file.value.name + ' csum..' })
    file.value.csum = await sfinx.csum(file.value, 'SHA-256')
    let r = await sfinx.sendMsgPromise('CheckFilePresense', file.value.csum)
    $q.loading.hide()
    if (r.length)
      return $q.$enotify('Such file hash already present in database')
    uploadDialog = $q.dialog({
      component: Progress,
      componentProps: {
        title: props.data.document.data.name,
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
  } else
      emit('done', props.data.document)
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
