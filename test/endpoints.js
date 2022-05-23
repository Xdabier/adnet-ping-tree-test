process.env.NODE_ENV = 'development'
var { Readable } = require('stream')
var test = require('ava')
var servertest = require('servertest')

var server = require('../lib/server')

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})
test.serial.cb('create target', function (t) {
  var url = '/api/targets'
  const s = servertest(server(), url, { encoding: 'json', method: 'POST' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
  Readable.from(JSON.stringify({
    url: 'http://example.com',
    value: 0.50,
    maxAcceptsPerDay: 10,
    accept: {
      geoState: {
        $in: [
          'ca',
          'ny'
        ]
      },
      hour: {
        $in: [
          '13',
          '14',
          '15'
        ]
      }
    }
  })).pipe(s)
})
let id
test.serial.cb('get all targets', function (t) {
  var url = '/api/targets'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.true(Array.isArray(res.body.data.list), 'data is array')
    console.log('get data', res.body.data)
    id = res.body.data.list[0]._id
    console.log('got id', id)
    t.end()
  })
})
test.serial.cb('get one target', function (t) {
  var url = '/api/target/' + id
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.end()
  })
})
test.serial.cb('update target', function (t) {
  var url = '/api/target/' + id
  const s = servertest(server(), url, { encoding: 'json', method: 'POST' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
  Readable.from(JSON.stringify({
    url: 'http://example.com',
    value: 0.50,
    maxAcceptsPerDay: 10,
    accept: {
      geoState: {
        $in: [
          'ca',
          'ny'
        ]
      },
      hour: {
        $in: [
          '13',
          '14',
          '15'
        ]
      }
    }
  })).pipe(s)
})
test.serial.cb('route visitor', function (t) {
  var url = '/route'
  const s = servertest(server(), url, { encoding: 'json', method: 'POST' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.true(!!res.body.url, 'it has url')
    t.end()
  })
  Readable.from(JSON.stringify({
    geoState: 'ca',
    publisher: 'abc',
    timestamp: '2018-07-19T14:28:59.513Z'
  })).pipe(s)
})
