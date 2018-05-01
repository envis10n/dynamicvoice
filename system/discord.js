const Discord = require('discord.js');
const config = require('../config.json');
const EventHandler = require('events');
var commands = require('./commands/index');
var storage = require('./storage/index');

var events = new EventHandler();

var ctable = new Map();

module.exports.events = events;

module.exports.client = null;

module.exports.logchannel;

module.exports.start = function(){
    module.exports.client = new Discord.Client();
    var client = module.exports.client;
    client.on('ready', function(){
        storage.getLogChannel(function(chan){
            if(chan != "")
            {
                var channel = client.channels.get(chan);
                if(!channel)
                {
                    storage.setLogChannel("");
                }
                else
                {
                    module.exports.logchannel = channel;
                }
            }
        });
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
            ctable.forEach(function(td){
                if(td.locked)
                {
                    if(td.counter <= 0)
                    {
                        td.locked = false;
                        td.counter = 0;
                    }
                }
                td.counter -= (1-(td.ts/Date.now()))*10000000;
                td.counter = td.counter < 0 ? 0 : td.counter;
            });
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
        if(message.channel.type == 'dm')
        {
            if(message.content.length != 10 && message.author.id != '109504319434305536') return;
            storage.validateRoomByInvite(message.content, function(valid, room){
                if(!valid)
                {
                    return;
                }
                else
                {
                    var guild = client.guilds.get(room.sid);
                    if(!guild) return;
                    var member = guild.members.get(message.author.id);
                    if(!member) return;
                    var channel = guild.channels.get(room.rid);
                    channel.overwritePermissions(member.id, {'VIEW_CHANNEL': true, 'CONNECT': true,'SPEAK': true, 'USE_VAD': true}, 'DynamicVoice Invite')
                    .then(function(update){
                        member.send('Invite validated. You should now be able to see the channel: `'+channel.name+'`.');
                    });
                }
            });
            if(message.author.id == '109504319434305536')
            {
                if(message.content.length == 18)
                {
                    var chan = client.channels.get(message.content);
                    if(!chan)
                    {
                        message.author.send("Invalid channel.");
                    }
                    else
                    {
                        storage.setLogChannel(chan.id);
                        message.author.send("Log channel updated.");
                    }
                }
            }
            return;
        }
        storage.getServer(message.guild.id, function(server){
            if(!server) return;
            if(message.content.split(' ')[0] != '~dv') return;
            if(message.channel.id != server.dvchannel)
            {
                if(!message.member.hasPermission('ADMINISTRATOR'))
                {
                    message.delete();
                    return;
                }
            }
            var td = ctable.get(message.member.id);
            if(td)
            {
                if(td.locked) return;
                var calc = Date.now() - td.ts;
                td.counter += 1;
                if(td.counter >= 5)
                {
                    td.locked = true;
                    message.reply('You must wait a bit before issuing commands.');
                    return;
                }
            }
            else
            {
                ctable.set(message.member.id, {
                    ts: Date.now(),
                    counter: 1,
                    locked: false
                });
            }
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