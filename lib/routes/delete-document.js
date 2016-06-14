'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  utils = require('../utils'),
  auth = require('../auth');

// Delete a document
router.delete('/:db/:id', auth.isAuthenticated, function(req, res) {
  var id = utils.addOwnerId(req.params.id, req.session.user.name);
  app.db.get(id, req.query.rev, function(err, data) {
    // We need a rev in order to delete
    if (!req.query.rev) {
      res.status(409).send({
        error: 'conflict',
        reason: 'Document update conflict.'
      });
      return;
    }
    if (err) {
      utils.sendError(err, res);
      return;
    }

    if (!utils.isMine(data, req.session.user.name)) {
      return auth.unauthorized(res);
    }
    
    app.db.destroy(id, req.query.rev,
      function(err, data) {
        if (err) {
          utils.sendError(err, res);
          return;
        }
        data.id = utils.removeOwnerId(data.id);
        utils.stripAndSendJSON(data, res);
      }
    );
  });
});

module.exports = router;
