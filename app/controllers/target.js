const sendJson = require('send-data/json')
const { create, update, get, all } = require('../models/target')
const { ValidatorResult } = require('jsonschema')
const targetController = {
  create: function (req, res) {
    create(req.data).then(value => sendJson(req, res, {
      status: 'OK'
    })).catch(reason => {
      if (reason instanceof ValidatorResult) {
        console.log(reason.errors)
      }
      sendJson(req, res, {
        status: 'FAIL'
      })
    })
  },
  target: function (req, res, opts) {
    if (req.method === 'POST') {
      targetController.create(req, res)
    } else if (req.method === 'GET') {
      targetController.all(req, res)
    }
  },
  targetWithId: function (req, res, opts) {
    if (req.method === 'POST') {
      targetController.update(req, res, opts)
    } else if (req.method === 'GET') {
      targetController.get(req, res, opts)
    }
  },
  update: function (req, res, opts) {
    update(opts.params.id, req.data)
      .then(value =>
        sendJson(req, res, {
          status: 'OK'
        })).catch(reason => {
        sendJson(req, res, {
          status: 'FAIL'
        })
      })
  },
  get: function (req, res, opts) {
    get(opts.params.id)
      .then(value =>
        sendJson(req, res, {
          data: value
        }))
  },
  all: function (req, res, opts) {
    all()
      .then(value =>
        sendJson(req, res, {
          data: value
        }))
  }
}
module.exports = targetController
