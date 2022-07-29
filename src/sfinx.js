
import logger from '@/logger'
import { app } from '@/boot/app.js'
import { v4 as uuidv4 } from 'uuid'
import { sha512 } from '@/crypto'
import { store } from '@/boot/store'
import * as tus from 'tus-js-client'
import * as jose from 'jose'
import { useQuasar } from 'quasar'

let wss, _connected, _disconnected
let dispatch = {}
let authAttempted
let sfinxAPIVersion = '0.0.2'
let endpoint = 'wss://' + location.hostname + '/sfinx/' + sfinxAPIVersion

export const _1_SECOND = 1000

export default {
  $q: null,
  isDev: (process.env.NODE_ENV == 'development'),
  async passPrompt(title, message, type) {
    let pass = await this.prompt(title, message, type)
    if (pass.length < 8)
      return { e: this.shortPassError }
    return { k: pass }
  },
  async prompt(title, message, type) {
    try {
      return await this.dialog(title, message, type)
    } catch (e) {
      return ''
    }
  },
  dialog(title, message, type) {
    if (!type)
      type = 'text'
    return new Promise((resolve, reject) => {
      this.$q.dialog({
        title,
        message,
        prompt: {
          model: '',
          type
        },
        cancel: true,
        persistent: true
      }).onOk(data => resolve(data)).onCancel(() => reject()).onDismiss(() => reject())
    })
  },
  shortPassError: 'Unlock password is too short (< 8 characters)',
  async genMasterKey(donotset) {
    let pass = await this.prompt('Master Key', 'Enter the Master Key Unlock Password', 'password')
    if (pass.length < 8)
      return { e: 'getMasterKey: ' + this.shortPassError }
    let key = await this.sendMsgPromise('GetMasterKey')
    if (!key.length || !Object.keys(key[0]).length) {
      const newKey = crypto.getRandomValues(new Uint8Array(32))
      let jwe = await this.encrypt(newKey, pass)
      if (!donotset)
        await this.sendMsgPromise('SetMasterKey', jwe)
      return { k: newKey, jwe }
    } else { // decrypt the key
        let m = await this.decrypt(key[0], pass)
        if (m.e)
          return { e: 'getMasterKey: ' + m.e }
        return { k: m.d }
    }
  },
  async getMasterKey(donotset) {
    if (this.masterKey && this.masterKey.length)
      return { k: this.masterKey }
    let key = await this.genMasterKey(donotset)
    this.masterKey = key.e ? '' : key.k
    return key
  },
  alg: 'PBES2-HS256+A128KW',
  enc: 'A256GCM',
  aad(d) {
    const decoder = new TextDecoder()
    return decoder.decode(jose.base64url.decode(d.aad))
  },
  async decrypt(d, k) {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    try {
      let data = await jose.flattenedDecrypt(d, encoder.encode(k))
      return { d: decoder.decode(data.plaintext) }
    } catch(e) {
        return { d, e: e.message }
    }
  },
  async encrypt(d, k, aad) {
    const encoder = new TextEncoder()
    let jwe = new jose.FlattenedEncrypt(encoder.encode(d)).setProtectedHeader({ alg: this.alg, enc: this.enc })
    if (aad)
      jwe.setAdditionalAuthenticatedData(encoder.encode(aad))
    return await jwe.encrypt(encoder.encode(k))
  },
  getFileTypeCategory(mime) {
    let categories = [
      {
        name: 'image',
        types: [
          'image/gif',
          'image/jpeg',
          'image/png',
          'image/svg+xml',
          'image/tiff',
          'image/x-ms-bmp',
          'image/x-portable-anymap',
          'image/x-portable-bitmap',
          'image/x-portable-graymap',
          'image/x-portable-pixmap',
          'image/x-rgb',
          'image/x-xbitmap',
          'image/x-xpixmap'
        ]
      },
      {
        name: 'ebook',
        types: [
          'application/pdf',
          'application/epub+zip',
          'image/vnd.djvu'
        ]
      },
      {
        name: 'office',
        types: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.oasis.opendocument.text',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      }
    ]
    if (mime.startsWith('video/'))
      return 'video'
    for (let c of categories) {
      for (let t of c.types) {
        if (mime == t)
          return c.name
      }
    }
    return 'other'
  },
  async csum(file, algo) {
    const buffer = await file.arrayBuffer()
    const hash = await crypto.subtle.digest(algo, buffer)
    return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('')
  },
  uploadPause(upload, cb, terminate) {
    upload.abort(terminate).then(() => cb()).catch((err) => logger.error('uploadPause error: ' + err))
  },
  uploadResume(upload, cb) {
    if (!upload)
      return
    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        let prevUrl = upload._req._url, found
        for (let pu of previousUploads) {
          if (prevUrl == pu.uploadUrl) {
            found = pu
            break
          }
        }
        if (found) {
          cb(true)
          upload.resumeFromPreviousUpload(found)
        } else
            cb()
      } else
          cb()
      upload.start()
    }).catch((e) => {
      logger.warn('uploadResume error: ' + e)
    })
  },
  async uploadFile(file, cb) {
    // if (file.size > 100 * 1024 * 1024)
    //   return cb('Too big file (> 100Mb)')
    let now = () => (new Date().getTime()) / _1_SECOND
    let started = now()
    let headers = { user: store.loggedUser.footer, authToken: store.authToken, name: file.name, type: file.type, csum: file.csum }
    let upload = new tus.Upload(file, {
      endpoint: 'https://' + location.hostname + '/uploads/',
      headers,
      chunkSize: 8 * 1024 * 1024,
      uploadDataDuringCreation: true,
      parallelUploads: 1,
      retryDelays: [0, 1000, 2000],
      onSuccess: () => cb(null, null, (now() - started).toFixed(2)),
      onError: err => cb('upload: failed for file:' + file.name + ' because of ' + err.toString()),
      onProgress: (bytesUploaded, bytesTotal) => cb(null, (bytesUploaded / bytesTotal * 100).toFixed(2), null),
      onShouldRetry: (err, retryAttempt, options) => {
        let status = err.originalResponse ? err.originalResponse.getStatus() : 0
        if (status == 403 || status == 502)
          return false
        return true
      }
    })
    upload.start()
    return upload
  },
  async file2blob(file) {
    return new Promise((resolve, reject) => {
      try {
        let reader = new FileReader()
        reader.onload = (e) => resolve(new Blob([new Uint8Array(e.target.result)], { type: file.type }))
        reader.readAsArrayBuffer(file)
      } catch(e) {
          reject(e)
      }
    })
  },
  updateTimeout: 250,
  sliceSeparator: '|',
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
    let r = await this.sendMsgPromise('GetSlicesPath', [s.id])
    return this.slicePathCache[s.id] = r[0].path.join(' / ')
  },
  async buildSlicePaths(slices) {
    let tobuild = []
    for (let s of slices) {
      if (!this.slicePathCache[s.id])
        tobuild.push(s.id)
    }
    if (!tobuild.length)
      return slices
    let r = await this.sendMsgPromise('GetSlicesPath', tobuild)
    r.map(s => this.slicePathCache[s.id] = s.path.join(' / '))
    let res = []
    for (let s of slices)
      res.push({ name: s.name, id: s.id, ...{ path: this.slicePathCache[s.id] } })
    return res
  },
  dispatch_default(ro) {
    switch (ro.m) {
      case 'AppConnected':
        if (ro.d.version !== sfinxAPIVersion) {
          logger.error('Sfinx: Invalid server API version v' + ro.d.version + ', must be v' + sfinxAPIVersion)
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
  NEXT_ALLOWED_LOGIN_ATTEMPT_IN_SECONDS: 5,
  tooFastAuth() {
    let t = (((new Date()).getTime() - authAttempted) / _1_SECOND)
    if (t < this.NEXT_ALLOWED_LOGIN_ATTEMPT_IN_SECONDS)
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
    pass = sha512(wss.nonce + sha512(user + pass))
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
    if (!this.$q)
      this.$q = useQuasar()
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
    wss.onopen = e => {
      if (app.parameters.debug)
        logger.debug('Sfinx: ws connected')
    }
    wss.onclose = e => {
      let msg = 'Connection closed: ' + (e.reason ? (e.reason + ', ') : '') + 'code: ' + e.code
      // iterate over dispatch callbacks and trigger them with error
      for (const [key, value] of Object.entries(dispatch)) {
        value({
          e: msg
        })
      }
      dispatch = {}
      if (app.parameters.debug)
        logger.warn('Sfinx: ws closed: ' + (e.reason ? (e.reason + ', ') : '') + 'code: ' + e.code)
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
          logger.tx('=> ' + ((app.parameters.debug > 1) ? logger.json(so) : msg))
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
          if (app.parameters.debug) {
            if (app.parameters.debug < 2 && ro.m === 'Ping')
              return
            logger.rx('<= ' + ((app.parameters.debug > 1) ? logger.json(ro) : ro.m))
          }
          if (ro.m === 'Ping')
            return
          if (!(ro.u in dispatch))
           this.dispatch_default(ro)
          else {
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
