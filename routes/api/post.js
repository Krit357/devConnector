const express = require('express');
const router = express.Router();


// @route  get api/post
// @desc   test route
// @access public
router.get('/', (req, res) => res.send('Post route'))

module.exports = router;