
<template>
  <q-card-section style="max-height: 66vh;">
    <q-field label="Name" stack-label outlined dense class="q-mb-sm">
      <div class="self-center full-width no-outline" tabindex="0">{{ props.data.name }}</div>
    </q-field>
    <q-field label="Description" stack-label outlined dense class="q-mb-sm">
      <div class="self-center no-outline" tabindex="0">{{ props.data.description }}</div>
    </q-field>
    <embed ref="fileRef" :type="props.data.mime" style="width: 100%; height: 100%">
  </q-card-section>
  <q-btn dense class="bg-secondary text-white q-mb-xs q-mt-sm" glossy label="FullScreen" @click="fullscreen()"/>
</template>

<script setup>

import { ref, onMounted } from 'vue'
import sfinx from '@/sfinx'
import { useQuasar, Loading, QSpinnerGears, AppFullscreen } from 'quasar'
import logger from '@/logger'

const $q = useQuasar()

const props = defineProps({
  data: {
    type: Object
  }
})

const fileRef = ref(null)

const fullscreen = () => {
  AppFullscreen.request(fileRef.value).then(() => {
    // $q.$notify('Press F11 to exit fullscreen') - not displayed in fullscreen !?
  }).catch(e => {
    logger.error('fuillscreen failed' + e.message)
  })
}

onMounted(async () => {
  let url = 'https://dev.sfinx.in/files/' + $q.$store.loggedUser.footer + '/' + props.data.uploaded.name
  if (props.data.uploaded.on == true && sfinx.getFileTypeCategory(props.data.mime) != 'other') {
    let response = await fetch(url, {
      headers: {
          authtoken: $q.$store.authToken,
          user: $q.$store.loggedUser.footer,
          file: props.data.uploaded.name,
          mime: props.data.mime
        }
    })
    if (response.status == 200) {
      const body = response.body
      const reader = body.getReader()
      let blobParts = []
      Loading.show({
        spinner: QSpinnerGears
      })
      while (1) {
        const { value, done } = await reader.read()
        if (done)
          break
        blobParts.push(value)
      }
      let blob = new Blob(blobParts, { type: props.data.mime })
      Loading.hide()
      fileRef.value.src = URL.createObjectURL(blob)
    } else
        $q.$enotify('View File: Fetch error: ' + response.status)
  }
})

defineEmits(['update'])

</script>

<style scoped>

.q-card__section--vert {
  padding: 3px;
}

</style>
