var config = require("./config.json");
var EventEmitter = require('events');
var taskjs = require("task.js");

var checkJSON = (string = "") => {
    if(typeof string != "string") return false;

    try {
        if(typeof JSON.parse(string) == "object") return true;
    } catch (e) {}

    return false;
}

var dir = __dirname;

var last_connection;
var is_ready = false;

var run_server = (k) => {
    var websockets = require('ws');
    var server = new websockets.Server({port: 22122});

    server.on("connection", (socket, request) => {
        last_connection = socket;
        last_connection.on("message", (raw, b) => {
            if(checkJSON(raw.toString("utf8"))){
                switch(JSON.parse(raw.toString("utf8")).return_type){
                    case "room.check": {
                        k.emit("room.check", JSON.parse(raw.toString("utf8")).returned)
                        break;
                    }
                }
            }
        })
        is_ready = true;
    })

    
}

class JAPI extends EventEmitter {
    constructor(){
        super();
        this.checkJSON = checkJSON;
        this.event_loop = (dirname, conf) => {
            var websockets = require('ws');
            var ws_client = new websockets("ws://localhost:22122");
            var xmlhr = require("xmlhttprequest");
            var checkJSON = (string = "") => {
                if(typeof string != "string") return false;
                    
                try {
                    if(typeof JSON.parse(string) == "object") return true;
                } catch (e) {}

                return false;
            }

            ws_client.onmessage = (message) => {
                if(checkJSON(message.data)){
                    switch(JSON.parse(message.data).type){
                        case "room.check": {
                            var x = new xmlhr.XMLHttpRequest();
                            var b = true;
                            x.open("GET", `${conf.endpoints.jgames.protocol}${conf.endpoints.jgames.endpoint}${conf.endpoints.jgames.avaliable.rooms}${JSON.parse(message.data).room}`);
                            x.setRequestHeader("Content-Type", "application/json");
                            x.onreadystatechange = () => {
                                if(checkJSON(x.responseText) && b){
                                    ws_client.send(JSON.stringify({
                                        return_type: "room.check",
                                        returned: JSON.parse(x.responseText)
                                    }))
                                    b = false;
                                }
                            }
                            x.send()
                            break;
                        }
                    }
                }
            }
        }
        this.is_room = (room = "") => {
            //shared.jobs.push({type: "room.check", room: room});
            if(is_ready) last_connection.send(JSON.stringify({type: "room.check", room: room}))
        }
        this.run_events = () => {
            var event_task = new taskjs();
            run_server(this);
            event_task.run(this.event_loop, dir, config)
            this.emit("debug", {
                type: 1,
                msg: "events are ready to run"
            });
        };
    };
};

var isRoom = (room = "") => {
    var x = new xmlhr.XMLHttpRequest()
    x.open("GET", `${config.endpoints.jgames.protocol}${config.endpoints.jgames.endpoint}${config.endpoints.jgames.avaliable.rooms}${room}`);
    x.setRequestHeader("Content-Type", "application/json")
    x.send()
    var res = false;
    var is_ready = false;
    var f = setInterval(() => {
        if(checkJSON(x.responseText)) {
            if(JSON.parse(x.responseText).ok) res = true;
            is_ready = true;
            clearInterval(f);
        }
    }, 500)
    while(!is_ready);
    return res;
}

module.exports = {
    JAPI: JAPI
}