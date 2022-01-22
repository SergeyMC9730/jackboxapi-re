var config = require("./config.json");
var EventEmitter = require('events');
var taskjs = require("task.js");

/**
* **Validate JSON string**
* @param {string} string Input
* @returns boolean `(true | false)`
*/
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

/**
* **Websocket server**
* @param {JAPI} k JAPI Class
*/
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

/**
* **Jackbox API Class**
* @class
*/
class JAPI extends EventEmitter {
    constructor(){
        super();

        /**
        * **Validate JSON string**
        * @param {string} string Input
        * @returns boolean `(true | false)`
        */
        this.checkJSON = checkJSON;
        /**
         * **Event loop**
         * @param {string} dirname Directory path 
         * @param {object} conf Configuration
         */
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
        /**
         * **Request room info**
         * @param {string} room Room
         * @fires JAPI#room.check
         */
        this.is_room = (room = "") => {
            if(is_ready) last_connection.send(JSON.stringify({type: "room.check", room: room}))
        }

        /**
         * **Init event loop**
         */
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

module.exports = {
    JAPI: JAPI
}