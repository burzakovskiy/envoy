'use strict';

var app = require('../app'),
  stream = require('stream');


var isObject = function(obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
};

var isArray = function(obj) {
  return obj instanceof Array;
};

var isString = function(str) {
  return typeof str === 'string';
};

var addOwnerId = function(id, ownerid) {
  var match = id.match(/_local\/(.*)/);
  if (match) {
    var localid = match[1];
    return '_local/' + ownerid + '-' + localid;
  } else {
    return ownerid + '-' + id;
  }
};

var removeOwnerId = function(id) {
  var match = id.match(/_local\/(.*)/);
  if (match) {
    var localid = match[1].replace(/^[^-]+\-/,'');
    return '_local/' + localid;
  } else {
    return id.replace(/^[^-]+\-/,''); 
  }
};

var myId = function(id, ownerid) {
  return (id.indexOf(ownerid + '-') === 0);
}

var isMine = function(doc, ownerid) {
  return (doc && doc._id && myId(doc._id, ownerid))
}

var strip = function(doc) {
  if (typeof doc === 'object' && doc._id) {
    doc._id = removeOwnerId(doc._id);    
  }
  return doc;
}

var addAuth = function(doc, ownerid) {
  doc._id = addOwnerId(doc._id, ownerid);
  return doc;
}

var stripAndSendJSON = function (data, res) {
  // Should we strip the _rev, too?
  res.json(strip(data));
};

var sendError = function (err, res) {
  //console.error(err);
  res.status(err.statusCode).send({
    error: err.error,
    reason: err.reason
  });
};

// helper method to write a json object to cloudant
var writeDoc = function(db, id, data, req, res) {
  db.insert(data, id, function(err, body) {
    if (err) {
      sendError(err, res);
    } else {
      body.id = removeOwnerId(body.id);
      res.json(body);
    }
  });
};



// stream transformer that removes auth details from documents
var authRemover = function(onlyuser, removeDoc) {
  var firstRecord = true;
  
  
  var stripAuth = function (obj, onlyuser, removeDoc) {
    var addComma = false;
    var chunk = obj;

    // If the line ends with a comma, this would break JSON parsing.
    if (obj.endsWith(',')) {
      chunk = obj.slice(0, -1);
      addComma = true;
    }

    try { 
      var row = JSON.parse(chunk); 
    } catch (e) {
      return obj+'\n'; // An incomplete fragment: pass along as is.
    }  

    // if this line doesn't belong to the owner, filter it outs
    if (onlyuser && row.id && !myId(row.id, onlyuser)) {
      return '';
    }
  
    // remove ownerid from the id
    if (row.id) {
      row.id = removeOwnerId(row.id);
    }
    if (row.key) {
      row.key = removeOwnerId(row.key);
    }
    if (row._id) {
      row._id = removeOwnerId(row._id);
    }
    if (row.doc && row.doc._id) {
      row.doc._id = removeOwnerId(row.doc._id);
    }
  
    // if we need to remove the doc object
    if (removeDoc) {
      delete row.doc;
    }

    // Repack, and add the trailling comma if required
    var retval = JSON.stringify(row);
    if (firstRecord) {
      firstRecord = false;
      return retval+'';
    } else {
      return ',\n'+retval;
    }
  };
  
  var tr = new stream.Transform({objectMode: true});
  tr._transform = function (obj, encoding, done) {
    var data = stripAuth(obj, onlyuser, removeDoc);
    if (data) {
      this.push(data);
    }
    done();
  };
  return tr;
};

// stream transformer that breaks incoming chunks into lines
var liner = function() {

  var liner = new stream.Transform({objectMode: true});
   
  liner._transform = function (chunk, encoding, done) {
    var data = chunk.toString('utf8');
    if (this._lastLineData) {
      data = this._lastLineData + data;
    }
     
    var lines = data.split(/\s*\n/);
    this._lastLineData = lines.splice(lines.length-1,1)[0];
    lines.forEach(this.push.bind(this));
    done();
  };
   
  liner._flush = function (done) {
    if (this._lastLineData) {
      this.push(this._lastLineData);
    }
    this._lastLineData = null;
    done();
  };

  return liner;
};

// console.log utility
var dmp = function (msg, obj) {
  console.log(msg, JSON.stringify(obj, null, 2));
};

module.exports = {
  isObject: isObject,
  isArray: isArray,
  isString: isString,
  isMine: isMine,
  myId: myId,
  strip: strip,
  addAuth: addAuth,
  addOwnerId: addOwnerId,
  removeOwnerId: removeOwnerId,
  stripAndSendJSON: stripAndSendJSON,
  sendError: sendError,
  writeDoc: writeDoc,
  authRemover: authRemover,
  liner: liner,
  dmp: dmp
};
