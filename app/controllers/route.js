const sendJson = require('send-data/json')
const { search, updateRequest } = require('../models/target')
const routeController = {
  route: function (req, res) {
    search(req.data.geoState, req.data.publisher, req.data.timestamp).then(value => {
      if (value.count === 0) {
        sendJson(req, res, {
          decision: 'reject'
        })
      } else {
        const targetId = value.list[0]._id
        const target = value.list[0].item
        updateRequest(targetId, target)
        sendJson(req, res, {
          url: target.url
        })
      }
    }).catch(reason => {
      console.error(reason)
      sendJson(req, res, {
        decision: 'reject'
      })
    })
  }
}
module.exports = routeController
