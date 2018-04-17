const Command = require('../../../lib/Command');
var storage = require('../../storage/index');
var router = new Command();

router.use(function(data, next){
    if(data.message.member.hasPermission('ADMINISTRATOR')) next();
});

router.use('ok', function(data){
    data.message.reply('okay!');
});

router.use('ping', function(data){
    data.message.reply('pong.');
});

router.use(function(data){
    data.message.reply('Test methods available: `ok, ping, log`');
});

module.exports = router;