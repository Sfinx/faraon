
import pjson from '@/../package.json'
import bjson from '@/../build.json'
import logger from '@/logger'
import { boot } from 'quasar/wrappers'

const app = createApp()

export default boot(({ app:a }) => {
  a.config.globalProperties.$app = app
})

function url2json()
{
 let query = location.search.substr(1)
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

function createApp()
{
 let app = {}
 app.name = pjson.name
 app.description = pjson.description
 app.version = pjson.version
 app.parameters = url2json()
 app.buildInfo = 'git: ' + bjson.git + ' ' + (process.env.DEV ? "development" : "production") + ' build from ' + bjson.buildStamp
 logger.info(app.name + ' v' + app.version + ' started. ' + app.buildInfo)
 app.parameters.debug =  process.env.PROD ? 0 : 2
 if (app.parameters.debug) {
   logger.info('Setting debug level to ' + app.parameters.debug)
 }
 return app
}

export { app }
