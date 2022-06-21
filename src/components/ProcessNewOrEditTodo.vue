
<template>
  <q-card-section v-if="shown" class="items-center" style="width: 40vw">
    <q-input v-model="props.data.document.name" outlined label-color="black" label="ToDo Name" ref="todoNameRef" @keydown.enter.prtodo="todoDescriptionRef.focus()" class="q-mb-sm"/>
    <q-input v-model="props.data.document.description" outlined label-color="black" label="ToDo Description" ref="todoDescriptionRef"/>
    <q-scroll-area ref="scrollRef" class="outline rounded-borders q-mt-md" style="height: 35vh; outline-width: thin">
      <draggable v-model="props.data.document.items" item-key="index">
        <template #item="{element, index}">
          <div class="q-my-md column">
            <div class="row">
              <q-checkbox v-model="element.done"/>
              <q-input v-model="element.name" dense outlined style="width: 35vw; height: 10px !important" :label="'Item ' + index" label-color="black"/>
              <q-icon name="mdi-close" size="19px" class="rounded q-ml-sm q-mt-sm glossy shadow bg-red text-white" @click="removeItem(index)"/>
            </div>
          </div>
        </template>
      </draggable>
    </q-scroll-area>
    <q-icon v-ripple name="mdi-plus" size="25px" class="rounded q-ml-sm q-mt-sm glossy shadow bg-secondary text-white" @click="newItem"/>
    <q-checkbox class="q-mt-sm q-ml-lg" v-model="props.data.document.hideDone" label="Hide done items"/>
  </q-card-section>
</template>

<script setup>

import logger from '@/logger'
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import draggable from 'vuedraggable'

const $q = useQuasar()

const todoNameRef = ref(null)
const todoDescriptionRef = ref(null)
const scrollRef = ref(null)
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
    hideDone: true,
    items: []
  }
}

const removeItem = (idx) => props.data.document.items.splice(idx, 1)

const newItem = () => {
  let item = {
    name: '',
    done: false
  }
  props.data.document.items.push(item)
  setTimeout(() => scrollRef.value.setScrollPercentage('vertical', 1.0), 10)
}

onMounted(() => {
  if (!props.data.edit)
    props.data.document = getDefaults()
  shown.value = true
  setTimeout(() => todoNameRef.value.focus(), 10)
})

const emit = defineEmits(['done'])

const process = () => {
  let todo = { type: 'todo', ...props.data.document }
  // logger.trace('newOrEditTodo: process: ' + logger.json(todo))
  emit('done', todo)
}

defineExpose({
  process
})

</script>

<style scoped>

.q-card__section--vert {
  padding: 3px;
}

</style>
