
<template>
  <q-card-section class="items-center" >
    <q-field label="Name" stack-label outlined dense>
      <template v-slot:control>
        <div class="self-center full-width no-outline" tabindex="0">{{ props.data.name }}</div>
      </template>
    </q-field>
    <q-scroll-area class="outline rounded-borders q-mt-md" style="height: 35vh; outline-width: thin">
      <div class="self-center no-outline q-ma-xs" tabindex="0" v-html="props.data.description"></div>
    </q-scroll-area>
  </q-card-section>
</template>

<script setup>

import sfinx from '@/sfinx'

const props = defineProps({
  data: {
    type: Object
  }
})

</script>

<style scoped>

.q-card__section--vert {
  padding: 3px;
}

</style>
