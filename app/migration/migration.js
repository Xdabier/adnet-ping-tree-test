const redis = require('../../lib/redis')

async function list () {
  return new Promise((resolve, reject) => {
    redis.send_command('FT._LIST', function (err, data) {
      if (err) reject(err)
      resolve(data)
    })
  })
}

async function checkMigration (idString) {
  const data = await list()
  return data.indexOf(idString) === -1
}

module.exports = {
  list,
  checkMigration
}
