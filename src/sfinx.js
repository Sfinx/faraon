
import logger from '@/logger'
import pjson from '../package.json'
import { app } from '@/boot/app.js'
import { v4 as uuidv4 } from 'uuid'
import { sha512 } from '@/crypto'
import { store } from '@/boot/store'

let wss, _connected, _disconnected
let dispatch = {}
let authAttempted
let api_version = '0.0.1'
let endpoint = 'wss://' + location.hostname + ':19081/sfinx/' + api_version

export default {
  updateTimeout: 250,
  sliceSeparator: '|',
  getDocumentType(type) {
    return type.at(0).toUpperCase()
  },
  getFullDocumentType(doc) {
    return doc.type.charAt(0).toUpperCase() + doc.type.slice(1)
  },
  sendMsgPromise(cmd, data) {
    return new Promise((resolve, reject) => {
      this.sendMsg(cmd, res => {
        return res.e ? reject(res.e) : resolve(res.d)
      }, data)
    })
  },
  slicePathCache: [],
  async showFullSlicePath(s) {
    if (this.slicePathCache[s.id])
      return this.slicePathCache[s.id]
    let r = await this.sendMsgPromise('GetSlicePath', s.id)
    let path = ''
    for (let p of r) {
      if (path != '')
        path += ' / '
      path += p.name
    }
    this.slicePathCache[s.id] = path
    return path
  },
  dispatch_default(ro) {
    if (app.parameters.debug)
     logger.debug('Sfinx: Default message dispatch, msg: ' + ((app.parameters.debug > 1) ? logger.json(ro) : ro.m))
    switch (ro.m) {
      case 'AppConnected':
        if (ro.d.version !== api_version) {
          logger.error('Sfinx: Invalid server API version v' + ro.d.version + ', must be v' + api_version)
          wss.close(4104, 'Invalid server API version')
        } else {
          wss.nonce = ro.d.nonce
          _connected(ro.d)
          store.init()
        }
        break
      default:
        logger.warn('dispatch_default: Undispatched ' + logger.json(ro))
    }
  },
  tooFastAuth() {
    let t = (((new Date()).getTime() - authAttempted) / 1000)
    if (t < 5)
      return true
    authAttempted = (new Date()).getTime()
    return false
  },
  sendMsg(msg, uiCb, args) {
    wss.send_msg(msg, uiCb, args)
  },
  logout() {
    wss?.close(4101, 'Logout')
  },
  login(user, pass, uiCb) {
    pass = sha512(user + wss.nonce + pass)
    let a = { ...app }
    delete a.name
    delete a.description
    wss.send_msg('Login', uiCb, {
      user,
      pass,
      app: a
    })
  },
  connect(connected, disconnected) {
    _connected = connected
    _disconnected = disconnected
    if (wss && (wss.readyState !== WebSocket.CLOSED))
      this.logout()
    this.reconnect()
    setInterval(() => {
      if (!wss || (wss.readyState === WebSocket.CLOSED))
        this.reconnect()
    }, 4000)
  },
  reconnect() {
    if (app.parameters.debug)
      logger.debug('Sfinx: connecting to ' + endpoint)
    try {
      wss = new WebSocket(endpoint)
    } catch (e) {
      if (app.parameters.debug)
        logger.error('Sfinx: connect error: ' + e.message)
      return
    }
    // wss.stop_heartbeat = () => {
    //   if (wss.heartbeat_interval)
    //     clearInterval(wss.heartbeat_interval)
    //   wss.heartbeat_interval = null
    //   wss.missed_heartbeats = 0
    // }
    wss.onopen = e => {
      if (app.parameters.debug)
        logger.debug('Sfinx: ws connected')
    }
    wss.onclose = e => {
      // wss.stop_heartbeat()
      let msg = 'Connection closed: ' + (e.reason ? (e.reason + ', ') : '') + 'code: ' + e.code
      // iterate over dispatch callbacks and trigger them with error
      for (const [key, value] of Object.entries(dispatch)) {
        value({
          e: msg
        })
      }
      dispatch = {}
      if (app.parameters.debug)
        logger.info('Sfinx: ws closed: ' + (e.reason ? (e.reason + ', ') : '') + 'code: ' + e.code)
      _disconnected()
    }
    wss.onerror = e => {
      if (app.parameters.debug)
        logger.warn('Sfinx: ws error, ' + (e.reason ? (', reason: ' + e.reason) : '') + (e.code ? 'code: ' + e.code : 'closing'))
      wss.close(4100)
    }
    wss.send_msg = (msg, cb, data, err) => {
      if (wss.readyState != WebSocket.OPEN)
        return
      try {
        let uuid = uuidv4()
        let so = {
          u: uuid,
          m: msg,
          d: data,
          e: err
        }
        if (cb)
          dispatch[uuid] = cb
        if (app.parameters.debug && ((msg !== 'Ping') || (app.parameters.debug > 2)))
          logger.debug('Sfinx: send_msg: ' + ((app.parameters.debug > 1) ? logger.json(so) : msg))
        wss.send(JSON.stringify(so))
      } catch (e) {
          logger.error('Sfinx: ws error in send_message: ' + (e.message ? (e.message + e.stack) : logger.json(e)))
          wss.close(4102, 'Error in send_message')
      }
    }
    wss.onmessage = e => {
      let ro = null
      try {
          ro = JSON.parse(e.data)
      } catch (e) {
      }
      if (!ro) {
        if (app.parameters.debug)
          logger.error('Sfinx: closing: Invalid message: ' + e.data)
        wss.close(4103, 'Invalid message')
      } else {
          // if (!wss.heartbeat_interval) {
          //   wss.missed_heartbeats = 0
          //   wss.heartbeat_interval = setInterval(function () {
          //     if (wss.readyState !== WebSocket.OPEN)
          //       return
          //     try {
          //       wss.missed_heartbeats++
          //       if (wss.missed_heartbeats >= 3)
          //         throw new Error('Sfinx: Too many missed heartbeats')
          //       wss.send_msg('Ping')
          //     } catch (e) {
          //         if (app.parameters.debug)
          //           logger.error('Sfinx: Heartbeat exception: Closing: ' + e.message)
          //         wss.close(4103, e.message)
          //     }
          //   }, 3000)
          // }
          if (ro.m === 'Ping') {
            // wss.missed_heartbeats = 0
            return
          }
          if (!(ro.u in dispatch))
           this. dispatch_default(ro)
          else {
            if (app.parameters.debug)
              logger.debug('Sfinx: Dispatching msg: ' + ((app.parameters.debug > 1) ? logger.json(ro) : ro.m))
            // if (!ro.e) {
            //   // update store state
            //   switch (ro.m) {
            //     default:
            //       break
            //   }
            // }
            dispatch[ro.u](ro)
            delete dispatch[ro.u]
          } // dispatching
      } // valid message
    }
  }
}
