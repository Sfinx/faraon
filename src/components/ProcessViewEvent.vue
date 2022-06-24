
<template>
  <q-card-section class="items-center" >
    <q-field label="Name" stack-label outlined dense class="q-mb-sm">
      <div class="self-center full-width no-outline" tabindex="0">{{ props.data.name }}</div>
    </q-field>
    <q-field label="Description" stack-label outlined dense class="q-mb-sm">
      <div class="no-outline">{{ props.data.description }}</div>
    </q-field>
    <div class="row justify-between q-mb-sm">
      <q-field stack-label label="From" style="width: 35%" outlined dense>
        <div class="self-center no-outline" tabindex="0">{{ props.data.from }}</div>
      </q-field>
      <q-field stack-label label="To" style="width: 35%" outlined dense>
        <div class="self-center no-outline" tabindex="0">{{ props.data.to }}</div>
      </q-field>
    </div>
    <q-field label="URL" stack-label outlined dense class="q-mb-sm">
      <div class="self-center no-outline" tabindex="0">{{ props.data.url }}</div>
    </q-field>
    <q-field outlined dense class="q-mb-sm">
      <div class="self-center no-outline" tabindex="0">{{ (props.data.on ? 'Enabled' : 'Disabled') + ' / ' + (props.data.repeat.on ? 'Repeating' : 'OneShot')  }}</div>
    </q-field>
    <q-field outlined dense>
      <div class="self-center no-outline" tabindex="0">{{ 'Last occured at ' + format(new Date(props.data.lastTick * _1_SECOND), 'DD/MM/YY HH:mm:ss') }}</div>
    </q-field>
  </q-card-section>
</template>

<script setup>

import { format } from 'fecha'
import { _1_SECOND } from '@/sfinx'

const props = defineProps({
  data: {
    type: Object
  }
})

defineEmits(['update'])

</script>

<style scoped>

.q-card__section--vert {
  padding: 3px;
}

</style>
