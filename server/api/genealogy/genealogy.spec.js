'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /api/genealogys (List View (ASC))', function() {

  it('TEST AS: should respond with JSON array', function(done) {
    request(app)
      .get('/api/genealogys/list-view/all/563f306b8ec0996f20899aec/1/10/list/ASC')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});

describe('GET /api/genealogys (LIST View (DESC))', function() {

  it('TEST AS: should respond with JSON array', function(done) {
    request(app)
      .get('/api/genealogys/list-view/all/563f306b8ec0996f20899aec/1/10/list/DESC')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});


describe('GET /api/genealogys (List View (ASC) Specific Level)', function() {

  it('TEST AS: should respond with JSON array', function(done) {
    request(app)
      .get('/api/genealogys/list-view/3/563f306b8ec0996f20899aec/1/10/list/ASC')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});

describe('GET /api/genealogys (LIST View (DESC) Specific Level)', function() {

  it('TEST AS: should respond with JSON array', function(done) {
    request(app)
      .get('/api/genealogys/list-view/5/563f306b8ec0996f20899aec/1/10/list/DESC')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});


// GRID View

describe('GET /api/genealogys (GRID View (ASC))', function() {

  it('TEST AS: should respond with JSON array', function(done) {
    request(app)
      .get('/api/genealogys/list-view/all/563f306b8ec0996f20899aec/1/10/grid/ASC')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});

describe('GET /api/genealogys (GRID View (DESC))', function() {

  it('TEST AS: should respond with JSON array', function(done) {
    request(app)
      .get('/api/genealogys/list-view/all/563f306b8ec0996f20899aec/1/10/grid/DESC')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});


describe('GET /api/genealogys (GRID View (ASC) Specific Level)', function() {

  it('TEST AS: should respond with JSON array', function(done) {
    request(app)
      .get('/api/genealogys/list-view/1/563f306b8ec0996f20899aec/1/10/grid/ASC')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});

describe('GET /api/genealogys (GRID View (DESC) Specific Level)', function() {

  it('TEST AS: should respond with JSON array', function(done) {
    request(app)
      .get('/api/genealogys/list-view/2/563f306b8ec0996f20899aec/1/10/grid/DESC')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});


describe('POST /api/genealogy/create', function() {

  it('TEST AS: should respond with created member JSON', function(done) {
    var date = new Date();
    var postData = {
      ref: ['563f306b8ec0996f20899aec'],
      user: {
        id: 'TEST-USER-'+(date.getTime()/1000),
        name: 'Test User ('+(date.getTime()/1000)+')',
        ip: '127.0.0.1',
        email: 'test_user_'+(date.getTime()/1000)+'@test.com',
        countryName: 'India',
        countryCode: 'IN'
      }
    };

    request(app)
      .post('/api/genealogys/create')
      .send(postData)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        done();
      });
  });
});
