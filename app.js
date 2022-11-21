
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const http = require("http");
const chatsController = require('./controllers/chats');
const authController = require('./controllers/auth');
const app = express();
const Server = http.Server(app)
const io = require('socket.io')(Server)

app.use(bodyParser.json()); // application/json

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    'mongodb+srv://Ali_Molhem:ssR7WKU3KmJ-Frw@cluster0.yusqmam.mongodb.net/car-game'
  )
  .then(result => {
    Server.listen(8080);
  })
.catch(err => console.log(err));

const livePlayers = {}
const chatRoom = []
const carPosition = [0,1,2]

io.on('connection', socket => {
  // after successfully login or after restarting a game
  socket.on('new-player', player => {
    console.log('New player joined :', player)
    player['startGameTime'] = Date.now();
    livePlayers[player.id] = player
  })

  //receive message from the client
  socket.on('send-message', (playerName, message) => {
    chatRoom.push(`${playerName}: ${message}`)
    chatsController.createMessage(playerName, message)
    .then(result => {
      console.log(result)
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
    });
  })

  // When a player collision
  socket.on('collision', player => {
    player['endGameTime'] = Date.now();
    let gameTime = player['endGameTime'] - player['startGameTime'];
    authController.checkAndReplaceBestTime(gameTime, player)
    delete livePlayers[player.id]
  })

  // send the server message to the client
  setInterval(() => sendMessageToClient(socket), 1000);

  socket.on('disconnect', player => {
    delete livePlayers[player.id]
  })
})
const sendMessageToClient = socket => {
  let chats = chatsController.getChats
  let rankingUsers = authController.getRankingUsers
  let enemyPosition =  carPosition[Math.floor(Math.random() * carPosition.length)];
  let response = {
    chats: chats,
    enemyPosition: enemyPosition,
    rankingUsers: rankingUsers
  }
  // Emitting a new message. Will be consumed by the client
  socket.emit("message-from-server", response);
};
