const redis = require('../../lib/redis')
const { Validator } = require('jsonschema')
const prefix = 'target'
const incr = 'target:id'

function validate (data) {
  const schema = {
    id: '/target',
    type: 'object',
    properties: {
      url: { type: 'string' },
      value: { type: 'number' },
      maxAcceptsPerDay: { type: 'number' },
      accept: {
        type: 'object',
        properties: {
          geoState: {
            type: 'object',
            properties: {
              $in: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          },
          hour: {
            type: 'object',
            properties: {
              $in: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
  const v = new Validator()
  return v.validate(data, schema)
}

async function nextId (strId) {
  return new Promise((resolve, reject) => {
    redis.send_command('INCR', [strId], function (err, data) {
      if (err) reject(err)
      resolve(data)
    })
  })
}

async function set (prefix, id, data) {
  return new Promise((resolve, reject) => {
    const validation = validate(data)
    if (!validation.valid) {
      reject(validation)
    }
    if (typeof data._limit === 'undefined') {
      data._limit = data.maxAcceptsPerDay
    }
    if (typeof data._lastAccept === 'undefined') {
      data._lastAccept = new Date().getTime()
    }
    redis.send_command('JSON.SET', [`${prefix}:${id}`, '$', JSON.stringify(data)], function (err, data) {
      if (err) reject(err)
      resolve(data)
    })
  })
}

function mapList (data, deleteCachedAttr = false) {
  const list = []
  data.slice(1).forEach((item) => {
    if (typeof item === 'string') {
      list.push({ _id: item.match(/\d+/g)[0] })
    } else {
      const target = JSON.parse(item[1])
      if (deleteCachedAttr) {
        delete target._limit
        delete target._lastAccept
      }
      list[list.length - 1].item = target
    }
  })
  return {
    count: data[0],
    list: list
  }
}

async function get (id) {
  return new Promise((resolve, reject) => {
    redis.send_command('JSON.GET', [`target:${id}`, '$'], function (err, data) {
      if (err) reject(err)
      resolve(JSON.parse(data))
    })
  })
}

async function all () {
  return new Promise((resolve, reject) => {
    redis.send_command('FT.SEARCH', ['targetIdx', '*'], function (err, data) {
      if (err) reject(err)
      resolve(data)
    })
  })
}

function getHour (date) {
  return new Date(date).getUTCHours()
}

function dayInTimeMs () {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

async function search (geo, pub, time) {
  return new Promise((resolve, reject) => {
    redis.send_command('FT.SEARCH', ['targetIdx', `@state:{${geo}} @hour:{${getHour(time)}} @limit:[(0 +inf]|@last:[-inf (${dayInTimeMs()}]`, 'SORTBY', 'value', 'DESC', 'LIMIT', '0', '1', 'RETURN', '1', '$'], function (err, data) {
      if (err) reject(err)
      resolve(data)
    })
  })
}

module.exports = {
  create: async function (data) {
    const id = await nextId(incr)
    return set(prefix, id, data)
  },
  update: async function (id, data) {
    return set(prefix, id, data)
  },
  get: async function (id) {
    const data = (await get(id))[0]
    delete data._limit
    delete data._lastAccept
    return data
  },
  all: async function () {
    return mapList((await all()), true)
  },
  updateRequest: async function (id, data) {
    if (data._lastAccept < dayInTimeMs()) {
      data._limit = data.maxAcceptsPerDay - 1
      data._lastAccept = new Date().getTime()
    } else {
      data._limit--
    }
    return set(prefix, id, data)
  },
  search: async function (geo, pub, time) {
    return mapList((await search(geo, pub, time)))
  }
}
