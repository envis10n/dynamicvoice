var discord = require('./system/discord');
var storage = require('./system/storage/index');

discord.events.on('ready', function(){
    console.log('Bot online.');
});

storage.events.on('ready', function(){
    discord.start();
});