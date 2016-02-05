'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  PouchDB = require('pouchdb');

describe('changes', function () {
  it('sequence', function () {
    this.timeout(10000);
    var docCount = 2;
    var docs = testUtils.makeDocs(docCount),
      remoteURL = testUtils.url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL),
      seq1 = '',
      id ,rev;

    return remote.bulkDocs(docs).then(function () {
      return remote.changes();
    }).then(function (response) {
      seq1 = response.last_seq;
      // Update a document
      var newDoc = testUtils.makeDocs(1)[0];
      newDoc._id = response.results[0].id;
      newDoc._rev = response.results[0].changes[0].rev;
      return remote.put(newDoc);
    }).then(function (response) {
      id = response.id;
      rev = response.rev;
      return remote.changes({since: seq1});
    }).then(function (response) {
      assert.equal(response.results.length, 1,
        'Changes feed should contain single entry');
      assert.equal(response.results[0].id, id,
        'ID of document should be the one that was updated');
      assert.equal(response.results[0].changes[0].rev, rev,
        'Rev of document should be the one that was updated');
    });
  });
});
