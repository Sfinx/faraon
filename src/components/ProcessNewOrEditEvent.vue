
<template>
  <q-card-section v-if="shown" class="items-center" style="width: 40vw">
    <q-input v-model="props.data.document.name" outlined label-color="black" label="Event Name" ref="eventNameRef" @keydown.enter.prevent="eventDescriptionRef.focus()" class="q-mb-sm"/>
    <q-input v-model="props.data.document.description" outlined label-color="black" label="Event Description" ref="eventDescriptionRef" @keydown.enter.prevent="eventFromRef.focus()"/>
    <div class="q-py-sm row justify-between">
      <q-input ref="eventFromRef" label-color="black" label="From" style="max-width: 40%" filled v-model="props.data.document.from" @keydown.enter.prevent="eventToRef.focus()">
        <template v-slot:prepend>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="props.data.document.from" mask="YYYY-MM-DD HH:mm">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>

        <template v-slot:append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-time v-model="props.data.document.from" mask="YYYY-MM-DD HH:mm" format24h>
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
      <q-input ref="eventToRef" label-color="black" label="To" style="max-width: 40%" filled v-model="props.data.document.to" @keydown.enter.prevent="eventURLRef.focus()">
        <template v-slot:prepend>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="props.data.document.to" mask="YYYY-MM-DD HH:mm">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>

        <template v-slot:append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-time v-model="props.data.document.to" mask="YYYY-MM-DD HH:mm" format24h>
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>
    <q-input v-model="props.data.document.url" outlined label-color="black" label="URL / Location" ref="eventURLRef"/>
    <div class="q-py-sm row justify-left">
      <q-checkbox class="q-pt-sm " v-model="props.data.document.on" label="Enabled"/>
      <q-checkbox class="q-pt-sm q-pl-sm" v-model="props.data.document.repeat.on" label="Repeat"/>
      <q-checkbox class="q-pt-sm q-pl-sm" v-model="props.data.document.notify" label="Telegram Notify"/>
      <q-checkbox class="q-pt-sm q-pl-sm" v-model="props.data.document.notifyBefore.on" label="Notify Before"/>
    </div>
    <div v-if="props.data.document.notifyBefore.on" class="q-py-sm row justify-between">
      <q-input class="nospins" type="number" v-on:keypress="NumbersOnly" label-color="black" label="Notify Before Days" style="max-width: 30%" filled v-model="props.data.document.notifyBefore.days"/>
      <q-input class="nospins" type="number" v-on:keypress="NumbersOnly" label-color="black" label="Notify Before Hours" style="max-width: 30%" filled v-model="props.data.document.notifyBefore.hours"/>
      <q-input class="nospins" type="number" v-on:keypress="NumbersOnly" label-color="black" label="Notify Before Minutes" style="max-width: 30%" filled v-model="props.data.document.notifyBefore.minutes"/>
    </div>
    <div v-if="props.data.document.repeat.on" class="q-py-sm row justify-between">
      <q-input class="nospins" type="number" v-on:keypress="NumbersOnly" label-color="black" label="Repeat Months" style="max-width: 30%" filled v-model="props.data.document.repeat.months"/>
      <q-input class="nospins" type="number" v-on:keypress="NumbersOnly" label-color="black" label="Repeat Weeks" style="max-width: 30%" filled v-model="props.data.document.repeat.weeks"/>
      <q-input class="nospins" type="number" v-on:keypress="NumbersOnly" label-color="black" label="Repeat Days" style="max-width: 30%" filled v-model="props.data.document.repeat.days"/>
    </div>
  </q-card-section>
</template>

<script setup>

import logger from '@/logger'
import sfinx from '@/sfinx'
import { ref, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const eventNameRef = ref(null)
const eventDescriptionRef = ref(null)
const eventURLRef = ref(null)
const eventFromRef = ref(null)
const eventToRef = ref(null)
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
    from: '',
    to: '',
    url: '',
    notify: true,
    notifyBefore: {
      on: false,
      days: 0,
      hours: 0,
      minutes: 0
    },
    repeat: {
      on: false,
      months: 0,
      weeks: 0,
      days: 0
    },
    on: true
  }
}

onMounted(() => {
  if (!props.data.edit)
    props.data.document = getDefaults()
  shown.value = true
  setTimeout(() => eventNameRef.value.focus(), 10)
})

watch(() => [props.data.document?.from, props.data.document?.to, props.data.document?.repeat?.on, props.data.document?.on], (w, wprev) => props.data.document.lastTick = null)

const emit = defineEmits(['done'])

const process = () => {
  let event = { type: 'event', ...props.data.document }
  // logger.trace('newOrEditEvent: process: ' + logger.json(event))
  emit('done', event)
}

defineExpose({
  process
})

const NumbersOnly = (evt) => {
  evt = (evt) ? evt : window.event
  var charCode = (evt.which) ? evt.which : evt.keyCode
  if ((charCode > 31) && (charCode < 48 || charCode > 57))
    evt.preventDefault()
  else
    return true
}

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
