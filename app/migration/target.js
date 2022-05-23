const redis = require('../../lib/redis')
const { checkMigration } = require('./migration')

async function indexTarget () {
  return new Promise((resolve, reject) => {
    redis.send_command('FT.CREATE', ['targetIdx', 'ON', 'JSON', 'SCHEMA', '$.value', 'AS', 'value', 'NUMERIC', 'SORTABLE', '$.accept.geoState.$in[*]', 'as', 'state', 'TAG', '$.accept.hour.$in[*]', 'as', 'hour', 'TAG', '$._limit', 'as', 'limit', 'NUMERIC', '$._lastAccept', 'as', 'last', 'NUMERIC'], function (err, data) {
      if (err) reject(err)
      resolve(data)
    })
  })
}

module.exports = {
  migrate: async function () {
    if ((await checkMigration('targetIdx'))) {
      await indexTarget()
    }
  }
}
