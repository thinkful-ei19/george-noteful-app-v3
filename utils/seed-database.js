'use strict';

const mongoose = require('');

const { MONGDB_URI } = require('../config');
const Note = require('../models/note');

const seedNotes = require('../models/note');

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => Note.insertMany(seedNotes))
  .then(results => {
    console.info(`Inserted ${results.length} Notes`);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(err);
  });