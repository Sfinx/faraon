
<template>
  <q-card-section class="items-center" >
    <q-field outlined dense>
      <template v-slot:control>
        <div class="self-center full-width no-outline" tabindex="0">{{ props.data.name }}</div>
      </template>
    </q-field>
    <q-scroll-area class="outline rounded-borders q-mt-md" style="height: 35vh; outline-width: thin">
      <div class="self-center no-outline q-ma-xs" tabindex="0" v-html="props.data.description"></div>
    </q-scroll-area>
    <q-select
      filled
      v-model="props.data.slices"
      multiple
      dense
      use-chips
      stack-label
      label="Slices"
      class="q-mt-md outline rounded-borders"
      style="outline-width: thin"
    >
      <template v-slot:selected-item="scope">
        <q-chip
          dense
          @mouseenter="sfinx.showFullSlicePath(scope.opt)"
          :tabindex="scope.tabindex"
          class="q-mr-xs"
        >
        <!-- color="white"
        text-color="secondary" -->
          {{ scope.opt.name }}
        </q-chip>
      </template>
    </q-select>
  </q-card-section>
</template>

<script setup>

import logger from '@/logger'
import sfinx from '@/sfinx'

const props = defineProps({
  data: {
    type: Object
  }
})

</script>

<style>

.q-card__section--vert {
    padding: 3px;
}

</style>
