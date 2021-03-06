// Generated by CoffeeScript 1.4.0
var Field, OT_MUTATOR;

Field = require('./Field');

module.exports = {
  type: 'Model',
  "static": {
    OT_MUTATOR: OT_MUTATOR = 'mutator,otMutator'
  },
  events: {
    init: function(model) {
      var otFields;
      model._otFields = otFields = {};
      model.on('addSubData', function(data) {
        var field, ot, path, _results;
        if (ot = data.ot) {
          _results = [];
          for (path in ot) {
            field = ot[path];
            _results.push(otFields[path] = field);
          }
          return _results;
        }
      });
    },
    bundle: function(model) {
      var field, fields, path, _ref;
      fields = {};
      _ref = model._otFields;
      for (path in _ref) {
        field = _ref[path];
        if (field.toJSON) {
          fields[path] = field.toJSON();
        }
      }
      return model._onLoad.push(['_loadOt', fields]);
    },
    socket: function(model, socket) {
      var memory, otFields;
      otFields = model._otFields;
      memory = model._memory;
      return socket.on('otOp', function(_arg) {
        var field, op, path, v;
        path = _arg.path, op = _arg.op, v = _arg.v;
        if (!(field = otFields[path])) {
          field = otFields[path] = new Field(model, path);
          return field.specTrigger().on(function() {
            var val;
            val = memory.get(path, model._specModel());
            field.snapshot = (val != null ? val.$ot : void 0) || '';
            return field.onRemoteOp(op, v);
          });
        } else {
          return field.onRemoteOp(op, v);
        }
      });
    }
  },
  proto: {
    get: {
      type: 'accessor',
      fn: function(path) {
        var at, val;
        if (at = this._at) {
          path = path ? at + '.' + path : at;
        }
        val = this._memory.get(path, this._specModel());
        if (val && (val.$ot != null)) {
          return this._otField(path, val).snapshot;
        }
        return val;
      }
    },
    otInsert: {
      type: OT_MUTATOR,
      fn: function(path, pos, text, callback) {
        var op;
        op = [
          {
            p: pos,
            i: text
          }
        ];
        this._otField(path).submitOp(op, callback);
      }
    },
    otDel: {
      type: OT_MUTATOR,
      fn: function(path, pos, len, callback) {
        var del, field, op;
        field = this._otField(path);
        del = field.snapshot.substr(pos, len);
        op = [
          {
            p: pos,
            d: del
          }
        ];
        field.submitOp(op, callback);
        return del;
      }
    },
    ot: function(path, value, callback) {
      var at, finish, len,
        _this = this;
      if (at = this._at) {
        len = arguments.length;
        path = len === 1 || len === 2 && typeof value === 'function' ? (callback = value, value = path, at) : at + '.' + path;
      }
      finish = function(err, path, value, previous) {
        var field;
        if (!err && (field = _this._otFields[path])) {
          field.specTrigger(true);
        }
        return typeof callback === "function" ? callback(err, path, value, previous) : void 0;
      };
      return this._sendToMiddleware('set', [
        path, {
          $ot: value
        }
      ], finish);
    },
    otNull: function(path, value, callback) {
      var len, obj;
      len = arguments.length;
      obj = this._at && len === 1 || len === 2 && typeof value === 'function' ? this.get() : this.get(path);
      if (obj != null) {
        return obj;
      }
      if (len === 1) {
        return this.ot(path);
      } else if (len === 2) {
        return this.ot(path, value);
      } else {
        return this.ot(path, value, callback);
      }
    },
    isOtPath: function(path, nonSpeculative) {
      var data, _ref;
      data = nonSpeculative ? null : this._specModel();
      return ((_ref = this._memory.get(path, data)) != null ? _ref.$ot : void 0) != null;
    },
    isOtVal: function(val) {
      return !!(val && val.$ot);
    },
    _otField: function(path, val) {
      var field;
      path = this.dereference(path);
      if (field = this._otFields[path]) {
        return field;
      }
      field = this._otFields[path] = new Field(this, path);
      val || (val = this._memory.get(path, this._specModel()));
      field.snapshot = val && val.$ot || '';
      return field;
    },
    _loadOt: function(fields) {
      var json, path, _results;
      _results = [];
      for (path in fields) {
        json = fields[path];
        _results.push(this._otFields[path] = Field.fromJSON(json, this));
      }
      return _results;
    }
  }
};
