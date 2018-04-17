var db = require('./mongodb/index');
const shortid = require('shortid');
const EventHandler = require('events');

module.exports.events = new EventHandler();

db.events.on('ready', function(){
    console.log('Storage online.');
    module.exports.events.emit('ready');
});

module.exports.log = function(data){
    data = Object.assign({}, data, {ts: Date.now()});
    db.insert('logs', data);
};

module.exports.addServer = function(sid, cid, cb){
    var server = {
        id: sid,
        dvcategory: '',
        dvchannel: sid
    };
    db.insert('servers', server, cb);
};

module.exports.removeServer = function(sid, cb){
    db.deleteOne('servers', {id: sid}, cb);
};

module.exports.getServer = function(sid, cb){
    db.find('servers', {id: sid}, function(err, servers){
        if(err) throw err;
        cb(servers[0]);
    });
};

module.exports.updateServer = function(sid, data, cb){
    db.updateOne('servers', {id: sid}, data, cb);
};

module.exports.findRoom = function(uid, sid, cb){
    db.find('rooms', {$or: [{uid: uid, sid: sid},{rid: uid, sid: sid}]}, function(err, rooms){
        if(err) throw err;
        cb(rooms[0]);
    });
};

module.exports.findRooms = function(sid, cb){
    db.find('rooms', {sid: sid}, function(err, rooms){
        if(err) throw err;
        cb(rooms);
    });
};

module.exports.validateRoom = function(sid, invite, cb){
    db.find('rooms', {sid: sid, invite: invite}, function(err, rooms){
        if(err) throw err;
        var room = rooms[0];
        if(!room)
        {
            cb(false, null);
        }
        else
        {
            cb(true, room);
        }
    });
};

module.exports.deleteRoom = function(uid, sid, rid, cb){
    db.deleteOne('rooms', {uid: uid, rid: rid, sid: sid}, cb);
};

module.exports.deleteRooms = function(sid, cb){
    db.deleteMany('rooms', {sid: sid}, cb);
};

module.exports.createRoom = function(uid, rid, sid, cb){
    var invite = shortid.generate();
    var room = {
        uid: uid,
        rid: rid,
        invite: invite,
        sid: sid
    };
    db.insert('rooms', room, function(){
        cb(room);
    });
};