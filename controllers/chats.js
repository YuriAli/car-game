
const Chats = require('../models/chats');

exports.getChats = () => {
    Chats.find()
    .then(chats => {
        return chats;
    })
    .catch(err => {
        console.log(err)
    });
};
exports.createMessage = (playerName, message) => {
    const newMessage = new Chats({
        name: playerName,
        message: message
    });
    return newMessage.save()
};