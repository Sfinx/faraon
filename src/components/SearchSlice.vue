
<template>
  <div class="row">
  <div class="col">
    <q-select
      ref="slicesSearchRef"
      filled
      v-model="slicesSearch"
      option-value="id"
      option-label="path"
      use-input
      dense
      input-debounce="0"
      label="Slices Search"
      :options="slicesSearchOptions"
      @filter="slicesSearchFilterFn"
      @update:model-value="slicesSearchUpdated"
      behavior="menu"
    >
      <template v-if="slicesSearch && Object.keys(slicesSearch).length" v-slot:append>
        <q-icon name="clear" class="cursor-pointer" @click="resetSlicesFilter" />
      </template>
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">
            No results
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
  <q-icon v-if="slicesSearch && Object.keys(slicesSearch).length" v-ripple name="mdi-gesture-tap-button" size="19px" class="rounded cursor-pointer glossy q-ml-sm q-mt-md shadow text-black" @click="props.goto()" />
  </div>
</template>

<script setup>

import logger from '@/logger'
import sfinx from '@/sfinx'
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const slicesSearch = ref('')
const slicesSearchOptions = ref([])

const slicesSearchRef = ref(null)

const props = defineProps({
  filter: {
    type: Object,
    required: false,
    default: { slices: [{ name: 'Dao', id: '1' }] }
  },
  selected: {
    type: Object,
    required: false
  },
  goto: {
    type: Function,
    required: false
  }
})

const dao = { name: 'Dao', id: '1', path: 'Dao' }

const resetSlicesFilter = () => {
  slicesSearch.value = ''
  slicesSearchRef.value.updateInputValue('')
  slicesSearchRef.value.focus()
  Object.assign(props.filter, props.filter, { slices: [dao] })
}

const emit = defineEmits(['selected'])

const slicesSearchUpdated = async v => {
  if (v) {
    Object.assign(props.filter, props.filter, { slices: [v] })
    emit('selected', v)
  } else {
    slicesSearchRef.value.updateInputValue('')
    slicesSearchRef.value.focus()
    let slices = [dao]
    Object.assign(props.filter, props.filter, { slices })
    slicesSearchOptions.value = await sfinx.buildSlicePaths(slices)
  }
}

const slicesSearchFilterFn = (value, update) => {
  if (value == '')
    return update(async () => slicesSearchOptions.value = await sfinx.buildSlicePaths(props.filter.slices))
  if (props.selected)
    props.selected.length = 0
  sfinx.sendMsg('SlicesSearch', res => {
    if (res.e)
      $q.$enotify(res.e)
    else {
      update(async () => slicesSearchOptions.value = await sfinx.buildSlicePaths(res.d))
      Object.assign(props.filter, props.filter, { slices: res.d })
    }
  }, value)
}

const clear = () => slicesSearch.value = ''

onMounted(() => {
  if (props?.filter?.slices)
    props.filter.slices = [{ name: 'Dao', id: '1' }]
})

defineExpose({
  clear
})

</script>
