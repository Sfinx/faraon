
import pjson from '@/../package.json'
import bjson from '@/../build.json'
import logger from '@/logger'
import { boot } from 'quasar/wrappers'

const app = createApp()

function createApp() {
  let app = {
    name: pjson.name,
    description: pjson.description,
    version: pjson.version,
    build: process.env.NODE_ENV + ' build git:' + bjson.git + ' from ' + bjson.buildStamp,
    parameters: {
      debug: process.env.PROD ? 0 : 1,
      dbdebug: process.env.PROD ? 0 : 0,
      ...url2json()
    }
  }
  logger.info(app.name + ' v' + app.version + ', ' + app.build + ', app debug level: ' + app.parameters.debug + ', db debug level: ' + app.parameters.dbdebug)
  return app
}

export default boot(({ app:a }) => a.config.globalProperties.$app = app)

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
