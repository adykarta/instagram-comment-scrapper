const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagramController');



router.post('/post/get-comments', instagramController.scrapComments);

module.exports = router;