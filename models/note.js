'use strict';

const mongoose = require('mongoose');

let notesSchema = new mongoose.Schema({
  title:{ type:String, index:true },
  content: {type: String, index: true },
  created: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Note', noteSchema); 