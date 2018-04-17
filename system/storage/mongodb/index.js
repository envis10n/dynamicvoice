const MongoClient = require('mongodb').MongoClient;
const EventHandler = require('events');

module.exports.events = new EventHandler();

var mclient = null;

MongoClient.connect('mongodb://localhost:27017', function(error, client){
    if(err) throw err;
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