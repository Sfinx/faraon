
import { boot } from 'quasar/wrappers'
import { reactive } from 'vue'

const storeObj = {
 loggedUser: null,
 total_slices: 0,
 total_documents: 0,
 movingSlice: null,
 authToken: null
}

const store = reactive({
 ...storeObj,
 init: () => store.value = storeObj
})

export default boot(({ app }) => {
  app.config.globalProperties.$q.$store = store
})

export { store }
