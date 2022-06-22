
<template>
  <component ref="processDocumentRef" :is="component" :data="documentData" v-if="component"/>
</template>

<script setup>

import logger from '@/logger'
import { ref, shallowRef, onMounted } from 'vue'
import sfinx from '@/sfinx'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const processDocumentRef = ref(null)
const processDocument = () => processDocumentRef.value.process()
defineExpose({ processDocument })

const props = defineProps({
  data: {
    type: Object
  },
  type: {
    type: String
  },
  op: {
    type: String
  },
  id: {
    type: String,
    default: null,
    required: false
  }
})

const component = shallowRef(null)
// in a case absent handler for processed doc type
const emit = defineEmits(['error', 'update', 'ready'])

async function decrypt(d) {
  let key, encrypt = 1, data, error
  if (d.aad) {
    encrypt = 2
    try {
      key = await sfinx.prompt('Unique Password', 'Enter Unique Password for AAD [ ' + sfinx.aad(d) + ' ]', 'password')
    } catch(e) {
      key = ''
    }
  } else
      key = await sfinx.getMasterKey()
  error = 'Encrypt password is too short (< 8 characters)'
  if (key.length < 8)
    return { data, encrypt, error}
  data = await sfinx.decrypt(d, key)
  error = data.error ? data.error : undefined
  return { data, encrypt, error }
}

const documentData = ref(null)

onMounted(async () => {
  let type = sfinx.getFullDocumentType(props)
  // logger.trace('ProcessDocument type:' + type + ', op: ' + props.op)
  if (props.op == 'View' && props.data.ciphertext) {
    let { data, encrypt, error } = await decrypt(props.data)
    if (error)
      return emit('error', error)
    documentData.value = data
    if (encrypt == 1)
      emit('update', data, true)
  } else if (props.op == 'NewOrEdit' && props.data.document.data.ciphertext) {
      let { data, encrypt, error } = await decrypt(props.data.document.data)
      if (error)
        return emit('error', error)
      if (encrypt == 1)
        emit('update', data, true)
      documentData.value = { ...props.data, ...{ document: { data } }}
      console.log('Process0', encrypt, data)
  } else // unencrypted
      documentData.value = props.data
  console.log('Process', props.data)
  import(`./Process${props.op + type}.vue`).then(i => component.value = i.default).catch(e => emit('error', e))
  emit('ready')
})

</script>
