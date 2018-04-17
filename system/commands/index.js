const Command = require('../../lib/Command');
var storage = require('../storage/index');

var router = new Command();

// Example log all messages coming from users (no bots, no DMs)
/*router.use(function(data, next){
    var message = data.message;
    console.log(message.author.username+': '+message.content);
    next();
});*/

// Test suite and example router usage
router.use('test', function(data){
    var command = data.raw.split(' ')[0];
    data.raw = data.raw.split(' ').slice(1).join(' ');
    require('./test/index').run(command, data);
});

router.use('channel', function(data){
    if(!data.message.member.hasPermission('ADMINISTRATOR')) return;
    if(data.message.mentions.channels.size > 0)
    {
        var channel = data.message.mentions.channels.find('type','text');
        if(!channel)
        {
            data.message.reply('you must supply a valid text channel mention.');
        }
        else
        {
            storage.updateServer(data.message.guild.id, {dvchannel: channel.id}, function(){
                data.message.reply('channel set to: <#'+channel.id+'>');
            });
        }
    }
    else
    {
        storage.getServer(data.message.guild.id, function(server){
            if(server)
            {
                var channel = data.message.guild.channels.get(server.dvchannel);
                data.message.reply('current channel is: <#'+server.dvchannel+'>');
            }
        });
    }
});

router.use('category', function(data){
    if(!data.message.member.hasPermission('ADMINISTRATOR')) return;
    var cat = data.raw.split(' ')[0];
    if(!cat)
    {
        storage.getServer(data.message.guild.id, function(server){
            if(server)
            {
                var category;
                if(server.dvcategory != '')
                {
                    category = data.message.guild.channels.get(server.dvcategory);
                    if(!category)
                    {
                        category = {name: 'Invalid'};
                    }
                }
                else
                    category = {name: 'None'};
                data.message.reply('current category is set to: `'+category.name+'`.');
            }
        });
        return;
    }
    var category = data.message.guild.channels.get(cat);
    if(!category)
    {
        if(cat != 'none')
        {
            data.message.reply('you must supply a valid category ID.');
            return;
        }
    }
    else if(category.type != 'category')
    {
        if(cat != 'none')
        {
            data.message.reply('you must supply a valid category ID.');
            return;
        }
    }
    if(cat == 'none')
        category = {name: 'None'};
    storage.updateServer(data.message.guild.id, {dvcategory: (cat == 'none' ? '' : cat)}, function(){
        data.message.reply('category updated to: `'+category.name+'`.');
    });
});

router.use('room', function(data){
    var command = data.raw.split(' ')[0];
    data.raw = data.raw.split(' ').slice(1).join(' ');
    require('./room/index').run(command, data);
});

// Error handler
router.use(function(data, next, errors){
    errors.forEach(function(error){
        console.error(error);
        storage.log({type:'error', data: error});
    });
});

module.exports = router;