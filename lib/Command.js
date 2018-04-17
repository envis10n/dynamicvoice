class Command {
    constructor(){
        this.routes = [];
    };
    use(...args){
        var root = '*';
        var cb;
        if(typeof(args[0]) == 'string')
        {
            root = args[0];
            if(typeof(args[1]) != 'function')
            {
                throw new Error('Callback must be a function.');
            }
            else
            {
                cb = args[1];
            }
        }
        else if(typeof(args[0]) == 'function')
        {
            cb = args[0];
        }
        else
        {
            throw new Error('Bad arguments.');
        }
        this.routes.push({path: root, call: cb});
    };
    call(id, command, data, next, err){
        const self = this;
        var route = this.routes[id];
        if(!route)
        {
            next();
        }
        else
        {
            if(route.path == command || route.path == '*')
            {
                route.call(data, function(nerr){
                    if(nerr)
                    {
                        err.push(nerr);
                    }
                    
                    if(route.path == command && route.path != '*')
                    {
                        var cmd = data.raw.split(' ')[0];
                        data.raw = data.raw.split(' ').slice(1).join(' ');
                        self.call(id+1, data.raw.split(' ')[0], data, next, err);
                    }
                    if(route.path == '*') self.call(id+1, command, data, next, err);
                }, err);
            }
            else
            {
                self.call(id+1, command, data, err);
            }
        }
    };
    run(command, data, next){
        this.call(0, command, data, next, []);
    };
}

module.exports = Command;