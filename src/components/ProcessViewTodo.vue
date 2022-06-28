
<template>
  <q-card-section class="items-center" >
    <q-field label="Name" stack-label outlined dense>
      <div class="self-center full-width no-outline" tabindex="0">{{ props.data.name }}</div>
    </q-field>
    <q-field label="Description" stack-label outlined dense class="q-mt-md">
      <div class="self-center no-outline" tabindex="0" v-html="props.data.description"></div>
    </q-field>
    <q-scroll-area ref="scrollRef" class="outline rounded-borders q-mt-md" style="height: 35vh; outline-width: thin">
      <div v-for="(element, index) in props.data.items" :key="index" class="q-mt-md column justify-start">
        <div v-if="!(props.data.hideDone && element.done)" class="q-mx-xs q-my-xs row">
          <q-checkbox v-model="element.done" @click="done(index)"/>
          <q-input readonly v-model="element.name" dense outlined style="width: 90%; height: 10px !important" :label="'Item ' + index" label-color="black"/>
        </div>
      </div>
    </q-scroll-area>
    <q-checkbox class="q-mt-sm" v-model="props.data.hideDone" label="Hide done items" @click="hideDone()"/>
  </q-card-section>
</template>

<script setup>

import { ref } from 'vue'

const scrollRef = ref(null)

const props = defineProps({
  data: {
    type: Object
  }
})

const emit = defineEmits(['update'])
const hideDone = () => emit('update', { hideDone: props.data.hideDone })
const done = (idx) => emit('update', { items: props.data.items })

</script>

<style scoped>

.q-card__section--vert {
  padding: 3px;
}

</style>
