import { boot } from 'quasar/wrappers'
import { store as _store } from '@/boot/store'

export default boot(({app, router}) => {
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !_store.loggedUser) {
      app.config.globalProperties.$q.$notify('Access denied for ' + to.path)
      next({ path: '/' })
    } else
      next()
  })
})
