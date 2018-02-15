'use strict';

var mongoose = require('mongoose');

var _schema = {
  objid: String,
  userid: String,
  packs: Number,
  createdat: { type: Date, "default": Date.now },
  isactive: Boolean,
  totalpacks: Number,
  runcycles: {type: Number, "default": 0},
  totalearning: {type: Number, "default": 0},
  expirydate: { type: Date, "default": Date.now },

  isactive1: Boolean,
  expirydate1: { type: Date, "default": Date.now },
  runcycles1: {type: Number, "default": 0},
  totalearning1: {type: Number, "default": 0},

  isactive2: Boolean,
  expirydate2: { type: Date, "default": Date.now },
  runcycles2: {type: Number, "default": 0},
  totalearning2: {type: Number, "default": 0},

  isactive3: Boolean,
  expirydate3: { type: Date, "default": Date.now },
  runcycles3: {type: Number, "default": 0},
  totalearning3: {type: Number, "default": 0},

  isactive4: Boolean,
  expirydate4: { type: Date, "default": Date.now },
  runcycles4: {type: Number, "default": 0},
  totalearning4: {type: Number, "default": 0},

  isactive5: Boolean,
  expirydate5: { type: Date, "default": Date.now },
  runcycles5: {type: Number, "default": 0},
  totalearning5: {type: Number, "default": 0},

  isactive6: Boolean,
  expirydate6: { type: Date, "default": Date.now },
  runcycles6: {type: Number, "default": 0},
  totalearning6: {type: Number, "default": 0},

  isactive7: Boolean,
  expirydate7: { type: Date, "default": Date.now },
  runcycles7: {type: Number, "default": 0},
  totalearning7: {type: Number, "default": 0},

  isactive8: Boolean,
  expirydate8: { type: Date, "default": Date.now },
  runcycles8: {type: Number, "default": 0},
  totalearning8: {type: Number, "default": 0},

  isactive9: Boolean,
  expirydate9: { type: Date, "default": Date.now },
  runcycles9: {type: Number, "default": 0},
  totalearning9: {type: Number, "default": 0},

  isactive10: Boolean,
  expirydate10: { type: Date, "default": Date.now },
  runcycles10: {type: Number, "default": 0},
  totalearning10: {type: Number, "default": 0},

  isactive11: Boolean,
  expirydate11: { type: Date, "default": Date.now },
  runcycles11: {type: Number, "default": 0},
  totalearning11: {type: Number, "default": 0},

  isactive12: Boolean,
  expirydate12: { type: Date, "default": Date.now },
  runcycles12: {type: Number, "default": 0},
  totalearning12: {type: Number, "default": 0},

  isactive13: Boolean,
  expirydate13: { type: Date, "default": Date.now },
  runcycles13: {type: Number, "default": 0},
  totalearning13: {type: Number, "default": 0},

  isactive14: Boolean,
  expirydate14: { type: Date, "default": Date.now },
  runcycles14: {type: Number, "default": 0},
  totalearning14: {type: Number, "default": 0},

  isactive15: Boolean,
  expirydate15: { type: Date, "default": Date.now },
  runcycles15: {type: Number, "default": 0},
  totalearning15: {type: Number, "default": 0},

  isactive16: Boolean,
  expirydate16: { type: Date, "default": Date.now },
  runcycles16: {type: Number, "default": 0},
  totalearning16: {type: Number, "default": 0},

  isactive17: Boolean,
  expirydate17: { type: Date, "default": Date.now },
  runcycles17: {type: Number, "default": 0},
  totalearning17: {type: Number, "default": 0},

  isactive18: Boolean,
  expirydate18: { type: Date, "default": Date.now },
  runcycles18: {type: Number, "default": 0},
  totalearning18: {type: Number, "default": 0},

  isactive19: Boolean,
  expirydate19: { type: Date, "default": Date.now },
  runcycles19: {type: Number, "default": 0},
  totalearning19: {type: Number, "default": 0},

  isactive20: Boolean,
  expirydate20: { type: Date, "default": Date.now },
  runcycles20: {type: Number, "default": 0},
  totalearning20: {type: Number, "default": 0},

  isactive21: Boolean,
  expirydate21: { type: Date, "default": Date.now },
  runcycles21: {type: Number, "default": 0},
  totalearning21: {type: Number, "default": 0},

  isactive22: Boolean,
  expirydate22: { type: Date, "default": Date.now },
  runcycles22: {type: Number, "default": 0},
  totalearning22: {type: Number, "default": 0},

  isactive23: Boolean,
  expirydate23: { type: Date, "default": Date.now },
  runcycles23: {type: Number, "default": 0},
  totalearning23: {type: Number, "default": 0},

  isactive24: Boolean,
  expirydate24: { type: Date, "default": Date.now },
  runcycles24: {type: Number, "default": 0},
  totalearning24: {type: Number, "default": 0},

  isactive25: Boolean,
  expirydate25: { type: Date, "default": Date.now },
  runcycles25: {type: Number, "default": 0},
  totalearning25: {type: Number, "default": 0},

  oldexpirydate: { type: Date, "default": Date.now },

  isactivef: Boolean,
  expirydatef: { type: Date, "default": Date.now },
  runcyclesf: {type: Number, "default": 0},
  totalearningf: {type: Number, "default": 0},
};

// module.exports = function(mongoConnect) {
  var Schema   = mongoose.Schema;
  var ActiveSilverPacksSchema = new Schema(_schema);

  module.exports = mongoose.model('ActiveSilverPackDev', ActiveSilverPacksSchema);
// }
