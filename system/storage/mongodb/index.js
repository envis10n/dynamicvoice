const MongoClient = require('mongodb').MongoClient;
const EventHandler = require('events');

module.exports.events = new EventHandler();

var mclient = null;

MongoClient.connect('mongodb://localhost:27017', function(error, client){
    if(error) throw error;
    mclient = client;
    module.exports.events.emit('ready');
});

module.exports.find = function(collection = '', filter = {}, cb = function(){}){
    if(!mclient)
    {
        cb(new Error('Client not ready.'), null);
        return;
    }
    mclient.db('dvoice').collection(collection).find(filter).toArray(function(err, docs){
        if(err) throw err;
        if(docs)
        {
            cb(null, docs);
        }
        else
        {
            cb(null, []);
        }
    });
};

module.exports.deleteOne = function(collection = '', filter = {}, cb){
    if(!mclient)
    {
        cb(new Error('Client not ready.'), null);
        return;
    }
    mclient.db('dvoice').collection(collection).deleteOne(filter, cb);
};

module.exports.deleteMany = function(collection = '', filter = {}, cb){
    if(!mclient)
    {
        cb(new Error('Client not ready.'), null);
        return;
    }
    mclient.db('dvoice').collection(collection).deleteMany(filter, cb);
};

module.exports.updateOne = function(collection = '', filter = {}, data = {}, cb = function(){}){
    if(!mclient)
    {
        cb(new Error('Client not ready.'), null);
        return;
    }
    mclient.db('dvoice').collection(collection).updateOne(filter, {$set: data}, cb);
};

module.exports.updateMany = function(collection = '', filter = {}, data = {}, cb = function(){}){
    if(!mclient)
    {
        cb(new Error('Client not ready.'), null);
        return;
    }
    mclient.db('dvoice').collection(collection).updateMany(filter, {$set: data}, cb);
};

module.exports.insert = function(collection = '', data = {}, cb = function(){}){
    if(!mclient)
    {
        cb(new Error('Client not ready.'), null);
        return;
    }
    mclient.db('dvoice').collection(collection)[(typeof(data) == 'object' ? 'insertOne' : 'insertMany')](data, cb);
};