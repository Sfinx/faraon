
import { Notify } from 'quasar'
import { boot } from 'quasar/wrappers'

Notify.setDefaults({
  position: 'top',
  timeout: 3000,
  textColor: 'yellow',
  actions: [{ icon: 'close', color: 'white' }]
})

export default boot(({ app }) => {
 app.config.globalProperties.$q.$notify = (msg) => {
   app.config.globalProperties.$q.notify({ message: msg })
 }
 app.config.globalProperties.$q.$enotify = (msg) => {
  app.config.globalProperties.$q.notify({ message: msg, color: 'red-10' })
}
})
