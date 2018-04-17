const Discord = require('discord.js');
const config = require('../config.json');
const EventHandler = require('events');
var commands = require('./commands/index');
var storage = require('./storage/index');

var events = new EventHandler();

module.exports.events = events;

module.exports.client = null;

module.exports.start = function(){
    module.exports.client = new Discord.Client();
    var client = module.exports.client;
    client.on('ready', function(){
        client.guilds.forEach(function(guild){
            storage.getServer(guild.id, function(server){
                if(!server)
                {
                    storage.addServer(guild.id, guild.channels.find('type','text').id, function(){
                        storage.log({type: 'alert', message: 'Guild '+guild.id+' was missing from server list on startup.'});
                    });
                }
                else
                {
                    var category = guild.channels.get(server.dvcategory);
                    if(!category)
                    {
                        storage.log({type: 'alert', message: 'Server DV category invalid on startup.'});
                        storage.updateServer(guild.id, {dvcategory: ''});
                    }
                    storage.findRooms(guild.id, function(rooms){
                        rooms.forEach(function(room){
                            var channel = guild.channels.get(room.rid);
                            if(!channel)
                            {
                                storage.deleteRoom(room.uid, guild.id, room.rid, function(){
                                    storage.log({type: 'alert', message: 'Room channel was missing on startup.'});
                                });
                            }
                        });
                    });
                }
            });
        });
        events.emit('ready');
        setInterval(function(){
            client.guilds.forEach(function(guild){
                storage.findRooms(guild.id, function(rooms){
                    rooms.forEach(function(room){
                        var channel = guild.channels.get(room.rid);
                        if(!channel) return;
                        var tspan = Date.now() - channel.createdTimestamp;
                        if(tspan >= 30 * 1000)
                        {
                            if(!channel.members.has(room.uid))
                            {
                                storage.log({type: 'info', message: 'Channel expired. Owner no longer in channel after forbearance period.'});
                                channel.delete();
                            }
                        }
                    });
                });
            });
        }, 1000);
    });
    client.on('channelDelete', function(channel){
        storage.findRoom(channel.id, channel.guild.id, function(room){
            if(room)
            {
                storage.deleteRoom(room.uid, room.sid, room.rid, function(){
                    storage.log({type: 'info', message: 'Channel with linked room deleted. Cleaned up room data.'});
                });
            }
        });
    });
    client.on('guildCreate', function(guild){
        storage.log({type: 'info', message: 'Joined guild '+guild.id+'.'});
        storage.addServer(guild.id, guild.channels.find('type','text').id, function(){
            storage.log({type: 'alert', message: 'Guild '+guild.id+' was added.'});
        });
    });
    client.on('guildDelete', function(guild){
        storage.log({type: 'info', message: 'Left guild '+guild.id+'.'});
        storage.deleteRooms(guild.id, function(){
            storage.removeServer(guild.id, function(){
                storage.log({type: 'info', message: 'Cleaned up data for guild '+guild.id+'.'});
            });
        });
    });
    client.on('message', function(message){
        if(message.author.bot) return;
        if(message.channel.type == 'dm') return;
        storage.getServer(message.guild.id, function(server){
            if(!server) return;
            if(message.channel.id != server.dvchannel && !message.member.hasPermission('ADMINISTRATOR')) return;
            if(message.content.split(' ')[0] != '~dv') return;
            var data = {
                raw: message.content.split(' ').slice(1).join(' '),
                message: message
            };
            var command = data.raw.split(' ')[0];
            data.raw = data.raw.split(' ').slice(1).join(' ');
            commands.run(command, data, function(){

            });
        });
    });
    client.login(config.bot.token);
};