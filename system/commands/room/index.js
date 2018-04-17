const Command = require('../../../lib/Command');
var storage = require('../../storage/index');
var bot = require('../../discord');
const shortid = require('shortid');
var router = new Command();

router.use('create', function(data){
    var guild = data.message.guild;
    storage.findRoom(data.message.member.id, guild.id, function(room){
        if(room)
        {
            data.message.reply('You already have a valid room.');
            data.message.delete();
        }
        else
        {
            guild.createChannel(data.message.member.displayName+'-'+shortid.generate(), 'voice',[{id: guild.id, deny: 36701184}, {id: data.message.member.id, allow: 36701184}], 'DynamicVoice')
            .then(function(channel){
                storage.getServer(guild.id, function(server){
                    if(!server) channel.delete();
                    if(server.dvcategory != '')
                        channel.setParent(server.dvcategory);
                    storage.createRoom(data.message.member.id, channel.id, guild.id, function(room){
                        data.message.member.send('Your channel has been created. Invite users by giving them this invite code: `'+room.invite+'`.\nThey can use `~dv room invite <code>` to see your channel.');
                        data.message.delete();
                    });
                });
            })
            .catch(console.error);
        }
    });
});

router.use('invite', function(data){
    var guild = bot.client.guilds.get(data.message.guild.id);
    var member = guild.members.get(data.message.member.id);
    data.message.delete();
    storage.validateRoom(guild.id, data.raw.split(' ')[0], function(valid, room){
        if(!valid)
        {
            member.send('Invalid room invite.');
        }
        else
        {
            var channel = guild.channels.get(room.rid);
            channel.overwritePermissions(member.id, {'VIEW_CHANNEL': true, 'CONNECT': true,'SPEAK': true, 'USE_VAD': true}, 'DynamicVoice Invite')
            .then(function(update){
                member.send('Your permissions have been updated. You should be able to see the channel: `'+channel.name+'`.');
            });
        }
    });
});

module.exports = router;