
'use strict'

// https://www.w3schools.com/cssref/css_colors.asp

// bold: 'font-weight:bold',
// underline: 'text-decoration:underline',
// code: 'background: rgb(255, 255, 219); padding: 1px 5px; border: 1px solid rgba(0, 0, 0, 0.1); line-height: 18px; text-decoration:underline;'

let colors = {
  error: 'color:red; font-weight:bold',
  debug: 'color:blue',
  warn: 'color:DarkGoldenRod; text-decoration:underline',
  data: 'color:grey',
  info: 'color:green',
  verbose: 'color:cyan',
  trace: 'color:magenta'
}

let timestamps = true

let timestamp = () => {
  let date = new Date()
  return timestamps ? (new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('T', ' ').replace('Z', '') + ' ') : ''
}

let logger = {
 _timestamp: timestamp,
 timestamps: timestamps,
 json: o => { return JSON.stringify(o) },
 parse: o => { return JSON.parse(o) }
}

/* eslint-disable no-new-func */

for (let property in colors)
  if (colors.hasOwnProperty(property))
    logger[property] = new Function('m', 'console.log(this._timestamp() + "%c" + ((typeof m === "object") ? JSON.stringify(m) : m), "' +
      colors[property] + '")')

export default logger
