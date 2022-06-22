
<template>
  <q-card-section v-if="shown" class="items-center">
    <q-input v-model="props.data.document.data.name" outlined label-color="black" label="Note Name" ref="noteNameRef" @keydown.enter.prevent="noteDescriptionRef.focus()" class="q-mb-sm"/>
    <q-editor
      ref="noteDescriptionRef"
      class="q-mt-lg"
      v-model="props.data.document.data.description"
      :dense="$q.screen.lt.md"
      height="49vh"
      :toolbar="[
        [
          {
            label: $q.lang.editor.align,
            icon: $q.iconSet.editor.align,
            fixedLabel: true,
            options: ['left', 'center', 'right', 'justify']
          }
        ],
        ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
        ['token', 'hr', 'link', 'custom_btn'],
        [
          {
            label: $q.lang.editor.formatting,
            icon: $q.iconSet.editor.formatting,
            list: 'no-icons',
            options: [
              'p',
              'h1',
              'h2',
              'h3',
              'h4',
              'h5',
              'h6',
              'code'
            ]
          },
          {
            label: $q.lang.editor.fontSize,
            icon: $q.iconSet.editor.fontSize,
            fixedLabel: true,
            fixedIcon: true,
            list: 'no-icons',
            options: [
              'size-1',
              'size-2',
              'size-3',
              'size-4',
              'size-5',
              'size-6',
              'size-7'
            ]
          },
          {
            label: $q.lang.editor.defaultFont,
            icon: $q.iconSet.editor.font,
            fixedIcon: true,
            list: 'no-icons',
            options: [
              'default_font',
              'arial',
              'arial_black',
              'comic_sans',
              'courier_new',
              'impact',
              'lucida_grande',
              'times_new_roman',
              'verdana'
            ]
          },
          'removeFormat'
        ],
        ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

        ['undo', 'redo'],
        ['fullscreen']
      ]"
      :fonts="{
        arial: 'Arial',
        arial_black: 'Arial Black',
        comic_sans: 'Comic Sans MS',
        courier_new: 'Courier New',
        impact: 'Impact',
        lucida_grande: 'Lucida Grande',
        times_new_roman: 'Times New Roman',
        verdana: 'Verdana'
      }"
    />
  </q-card-section>
</template>

<script setup>

import logger from '@/logger'
import sfinx from '@/sfinx'
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const noteNameRef = ref(null)
const noteDescriptionRef = ref(null)
const shown = ref(false)

const props = defineProps({
  data: {
    type: Object
  }
})

const getDefaults = () => {
  return {
    name: '',
    description: ''
  }
}

onMounted(() => {
  if (!props.data.edit)
    props.data.document = { data: getDefaults() }
  shown.value = true
  setTimeout(() => noteNameRef.value.focus(), 10)
})

const emit = defineEmits(['done'])
const process = () => emit('done', props.data.document)

defineExpose({
  process
})

</script>

<style scoped>

.q-card__section--vert {
  padding: 3px;
}

</style>
