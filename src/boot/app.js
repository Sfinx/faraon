
import pjson from '@/../package.json'
import bjson from '@/../build.json'
import logger from '@/logger'
import { boot } from 'quasar/wrappers'
import { useQuasar } from 'quasar'

const app = createApp()

function createApp() {
  let app = {
    name: pjson.name,
    description: pjson.description,
    version: pjson.version,
    build: process.env.NODE_ENV + ' build git:' + bjson.git + ' from ' + bjson.buildStamp,
    parameters: {
      debug: process.env.PROD ? 0 : 2,
      dbdebug: process.env.PROD ? 0 : 0,
      ...url2json()
    }
  }
  logger.info(app.name + ' v' + app.version + ', ' + app.build + ', app debug level: ' + app.parameters.debug + ', db debug level: ' + app.parameters.dbdebug)
  return app
}

export default boot(({ app: a }) => {
  a.config.globalProperties.$app = app
  if (app.parameters.debug > 2) {
    logger.info('Enabling Vue performance tracing')
    a.config.performance = true
  }
  if (app.parameters.debug)
    a.config.warnHandler = w => logger.warn(w.toString() + ': ' + w.stack)
  a.config.errorHandler = e => {
    let m = e.toString() + ': ' + e.stack
    logger.error(m)
    const $q = useQuasar()
    $q.dialog({
      title: 'Sfinx Exception',
      color: 'red',
      fullWidth: true,
      ok: {
        color: 'secondary',
        glossy: true
      },
      message: m
    })
  }
})

function url2json() {
  let query = location.search.substring(1)
  let result = {}
  query.split('&').forEach((part) => {
    let item = part.split('=')
    if (part.length)
      result[item[0]] = decodeURIComponent(item[1])
  })
  return result
}

// polyfills
window.global = window

export { app }
