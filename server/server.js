
const express = require('express')
const urlParser = require('url');
const {
  recordVisit,
  checkUsername,
  getHighScores, writeScore,
} = require('./middleware');

const port = process.env.PORT || 8000;

const game = express();
game.use(express.json());
game.use(express.static('./'));
// game.post('/visit', [
//   recordVisit,
// ]);
console.log("server listening on port", port);

game.listen(port);
