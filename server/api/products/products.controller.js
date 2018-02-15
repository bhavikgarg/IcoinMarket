'use strict';

var _ = require('lodash');
var config = require('./../../config/environment').paypal;
var Products = require('./products.model');
var ProductService = require('./../../components/products/product.service');

// Get list of productss
exports.index = function(req, res) {
  var query = {}
  if(req.user.role != 'admin') {
    query = {ptype: req.query.type};
  }

  Products.find(query).sort({"_id": -1}).exec(function (err, products) {
    if(err) { return handleError(res, err); }
    return res.status(200).json({data: products});
  });
};

// Get a single products
exports.show = function(req, res) {
  Products.findById(req.params.id, function (err, products) {
    if(err) { return handleError(res, err); }
    if(!products) { return res.status(404).send('Not Found'); }
    return res.json(products);
  });
};

// Creates a new products in the DB.
exports.create = function(req, res) {
  Products.create(req.body, function(err, products) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(products);
  });
};

// Updates an existing products in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Products.findById(req.params.id, function (err, products) {
    if (err) { return handleError(res, err); }
    if(!products) { return res.status(404).send('Not Found'); }
    var updated = _.merge(products, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(products);
    });
  });
};

// Deletes a products from the DB.
exports.destroy = function(req, res) {
  Products.findById(req.params.id, function (err, products) {
    if(err) { return handleError(res, err); }
    if(!products) { return res.status(404).send('Not Found'); }
    products.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.producttypes = function(req, res) {
  var productService = new ProductService();
  return res.status(200).json(productService.getProductTypes());
}

function handleError(res, err) {
  return res.status(500).send(err);
}
