
<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: fit-content;">
      <q-toolbar class="bg-primary glossy text-white">
          <q-toolbar-title>{{ props.title }}</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup/>
        </q-toolbar>
      <q-card-section class="items-center">
        <q-linear-progress style="max-width: 95%;" stripe rounded size="20px" :value="props.progress / 100" class="q-ma-sm">
          <div class="absolute-full flex flex-center">
            <q-badge color="warning" text-color="accent" :label="props.progress + '%'" />
          </div>
        </q-linear-progress>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn glossy color="secondary" :label="props.paused ? 'Resume' : 'Pause'" @click="uploadPauseResume()"/>
        <q-btn glossy color="secondary" label="Cancel" @click="onDialogCancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'

const paused = ref(false)

const props = defineProps({
  title: {
    type: String
  },
  progress: {
    type: Number
  },
  pause: {
    type: Function
  }
})

defineEmits([ ...useDialogPluginComponent.emits ])

const uploadPauseResume = () => {
  paused.value = !paused.value
  props.pause(paused.value)
}

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

</script>
