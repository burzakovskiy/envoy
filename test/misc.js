'use strict';

var u = require('../lib/utils.js'),
  assert = require('assert');

describe('misc utils tests', function() {

  // parses VCAP_SERVICES successfully
  it('add/remove owner to id for normal doc', function(done) {
    var id = '938f5320-0fb3-5354-8ffc-09394a9737d6';
    var ownerid = 'mbaas1465913235414user0';
    var newid = u.addOwnerId(id, ownerid);
    assert.equal(newid, ownerid + '-' + id);
    var original = u.removeOwnerId(newid);
    assert.equal(original, id);
    done();
  });

  it('add/remove owner to id for _local doc', function(done) {
    var id = '_local/abc123';
    var ownerid = 'rita';
    var newid = u.addOwnerId(id, ownerid);
    assert.equal(newid, '_local/rita-abc123');
    var original = u.removeOwnerId(newid);
    assert.equal(original, id);
     done();
  });
  
  it('check ownership by valid ids', function(done) {
    var ownerid = 'rita';
    var ids = ['rita-a','rita-9770da92-7165-4026-ae09-02dd8984ed86','rita-9770da9271654026ae0902dd8984ed86'];
    ids.forEach(function(id) {
      var mine = u.myId(id, ownerid);
      assert(mine);
    });
    done();
  });
  
  it('check ownership of invalid ids', function(done) {
    var ownerid = 'rita';
    var ids = ['bob-a','9770da92-7165-4026-ae09-02dd8984ed86','sue-9770da9271654026ae0902dd8984ed86'];
    ids.forEach(function(id) {
      var mine = u.myId(id, ownerid);
      assert(!mine);
    });
    done();
  });  
  
  it('check ownership of documents', function(done) {
    var ownerid = 'rita';
    var docs = [
      { _id: 'rita-a', _rev:'1-123', a:1, b:2},
      { _id: 'rita-123', _rev:'1-123', a:1, b:2}
    ];
    var docs2 = [
      { _id: 'bob-a', _rev:'1-123', a:1, b:2},
      { _id: 'bpb-123', _rev:'1-123', a:1, b:2}
    ];
    docs.forEach(function(doc) {
      var mine = u.isMine(doc, ownerid)
      assert(mine);
    });
    docs2.forEach(function(doc) {
      var mine = u.isMine(doc, ownerid)
      assert(!mine);
    });
    done();
  });
  
  it('strip doc', function(done) {
    var ownerid = 'bob';
    var doc = { _id: 'bob-123', _rev:'1-123', a:1, b:2};
    var doc2 = { _id: '_local/bob-abc', _rev:'1-123', a:1, b:2};
    var stripped = u.strip(doc);
    var stripped2 = u.strip(doc2);
    assert.equal('123', stripped._id);
    assert.equal('_local/abc', stripped2._id);
    done();
  });


});
