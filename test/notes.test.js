'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Connect, seed, test, disconnect',() => {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function () {
    return Note.insertMany(seedNotes)
      .then(() => Note.createIndexes());
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
        'tags': []
      };
      let body;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('id', 'title', 'content');
          // 2) **then** call the database
          return Note.findById(body.id);
        })
      // 3) **then** compare
        .then(data => {
          expect(body.title).to.equal(data.title);
          expect(body.content).to.equal(data.content);
        });
    });
  });

  describe('GET /api/notes/:id', function () {
    it('should return correct notes', function () {
      let data;
      // 1) First, call the database
      return Note.findOne().select('id title content')
        .then(_data => {
          data = _data;
          // 2) **then** call the API
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'created');

          // 3) **then** compare
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });
  });

  describe('GET /api/notes', function () {
    it('should return the correct number of Notes', function () {
      // 1) Call the database and the API
      const dbPromise = Note.find();
      const apiPromise = chai.request(app).get('/api/notes');
      // 2) Wait for both promises to resolve using `Promise.all`
      return Promise.all([dbPromise, apiPromise])
      // 3) **then** compare database results to API response
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  // PUT

  describe('PUT /api/notes/:id', function () {
    it('should update a note based on its id and the new information', function(){
      const updateNote = {
        'title': 'What about dogs?!',
        'content': 'woof woof',
        'tags': []
      };
      let body;
      return chai.request(app).put('/api/notes/000000000000000000000000')
        .send(updateNote)
        .then(res=>{
          body = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('id', 'title', 'content', 'created');
          expect(body.id).to.equal('000000000000000000000000');
          expect(body.title).to.equal(updateNote.title);
          expect(body.content).to.equal(updateNote.content);
          return Note.findById({_id:'000000000000000000000000'});
        })
        .then(data=>{
          expect(data.title).to.equal(body.title);
          expect(data.content).to.equal(body.content);
          expect(data.id).to.equal(body.id);
        });
    });
  });

  describe('DELETE /api/notes/:id', function () {
    it('should remove an item with the give ID and return status 204 as well as null', () =>{
      let document;
      return Note.findOne()
        .select('id title content')
        .then((result) => {
          document = result;
          return chai.request(app)
            .delete(`/api/notes/${document.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(204);
        });
    });
    // it('should return an error if the id is falsey', function() {
    //   let fakeId = '5';
    //   return chai.request(app)
    //     .del(`/api/notes/${fakeId}`)
    //     .catch((err) => err.response)
    //     .then((res) => {
    //       expect(res).to.have.status(404);
    //     });
    // });

  });
});


