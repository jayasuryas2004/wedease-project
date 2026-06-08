const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');

router.post('/', async (req, res) => {
  const vendor = new Vendor(req.body);
  await vendor.save();
  res.send(vendor);
});

router.get('/', async (req, res) => {
  const vendors = await Vendor.find();
  res.send(vendors);
});

module.exports = router;
