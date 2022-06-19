
<template>
  <q-card-section class="items-center" >
    <q-field label="Name" stack-label readonly outlined dense class="q-mb-sm">
      <div class="self-center full-width no-outline" tabindex="0">{{ props.data.name }}</div>
    </q-field>
    <q-field label="Description" stack-label readonly outlined dense class="q-mb-sm">
      <div class="no-outline">{{ props.data.description }}</div>
    </q-field>
    <div class="row justify-between q-mb-sm">
      <q-field :label="'From: ' + props.data.from" style="width: 35%" outlined dense>
        <div class="self-center no-outline" tabindex="0"/>
      </q-field>
      <q-field :label="'To: ' + props.data.to" style="width: 35%" outlined dense>
        <div class="self-center no-outline" tabindex="0">{{ '    ' + props.data.to }}</div>
      </q-field>
    </div>
    <q-field label="URL" stack-label readonly outlined dense class="q-mb-sm">
      <div class="self-center no-outline" tabindex="0">{{ props.data.url }}</div>
    </q-field>
    <q-field readonly outlined dense class="q-mb-sm">
      <div class="self-center no-outline" tabindex="0">{{ (props.data.on ? 'Enabled' : 'Disabled') + ' / ' + (props.data.repeat.on ? 'Repeating' : 'OneShot')  }}</div>
    </q-field>
    <q-field readonly outlined dense>
      <div class="self-center no-outline" tabindex="0">{{ 'Last occured at ' + format(new Date(props.data.lastTick * 1000), 'DD/MM/YY HH:mm:ss') }}</div>
    </q-field>
  </q-card-section>
</template>

<script setup>

import sfinx from '@/sfinx'
import { format } from 'fecha'

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
