var config = require("./config.json");
var EventEmitter = require('events');
var taskjs = require("task.js");
var crypto = require("crypto")

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
 * **Room class**
 * @class
 */
class Room {
    constructor(){
        this.is_avaliable = false;
        this.game_selected = "";
        this.audience = 0;
        this.room = "";
        this.endpoint_player = "";
        this.endpoint_guest = "";
        this.locked = false;
        this.full = false;
        this.moderation_mode = false;
        this.has_password = false;
        this.require_twitch = false;
        this.language = "";
        this.joinas = "";
        this.debug = false;
        this.player_name = "";
        this.password = "";
        this.uid = "";
        this.appId = "";
        this.enable_audience = false;
        
        this.rawdata = "";
    }
}

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
                        var r = new Room();
                        var p = JSON.parse(raw.toString("utf8")).returned;
                        r.audience = (p.ok) ? 0 : null;
                        r.endpoint_guest = (p.ok) ? p.body.audienceHost : null;
                        r.endpoint_player = (p.ok) ? p.body.host : null;
                        r.room = (p.ok) ? p.body.code : null;
                        r.full = (p.ok) ? p.body.full : null;
                        r.locked = (p.ok) ? p.body.locked : null;
                        r.moderation_mode = (p.ok) ? p.body.moderationEnabled : null;
                        r.has_password = (p.ok) ? p.body.passwordRequired : null;
                        r.require_twitch = (p.ok) ? p.body.twitchLocked : null;
                        r.language = (p.ok) ? p.body.locale : null;
                        r.game_selected = (p.ok) ? p.body.appTag : null;
                        r.rawdata = JSON.stringify(p.body);
                        r.is_avaliable = p.ok;
                        r.joinas = (p.ok) ? ((!r.full) ? "player" : "audience") : null;
                        r.enable_audience = (p.ok) ? p.body.audienceEnabled : null;
                        r.debug = false;
                        r.password = JSON.parse(raw.toString("utf8")).args[1];
                        r.player_name = JSON.parse(raw.toString("utf8")).args[0];
                        r.uid = crypto.randomUUID(); //Jackbox checks only player UUID for preventing joining twice

                        /**
                        * @event JAPI#room.check
                        * @param {Room} room Room
                        */
                        k.emit("room.check", r);
                        break;
                    }
                    case "debug": {
                        /**
                        * @event JAPI#debug
                        * @param {Object} msg Debug message
                        */
                        k.emit("debug", JSON.parse(raw.toString("utf8")).returned);
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
        * @event JAPI#debug
        * @param {Object} msg Debug message
        */

        /**
        * @event JAPI#room.check
        * @param {Room} room Room
        */
        
        /**
        * @event JAPI#room.connection
        * @param {String} str string (not reverse engineered, just temp solution)
        */

        /**
         * **Lookup table for games**
         */
        this.game_lookuptable = {
        "triviadeath2": ["Trivia Murder Party 2", "Смертельная вечеринка 2"]
        }
        

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

            ws_client.on("open", () => {
                ws_client.send(JSON.stringify({
                    return_type: "debug",
                    returned: {
                        type: 2,
                        msg: "Event thread and main thread are linked"
                    }
                }));
            });

            ws_client.onmessage = (message) => {
                if(checkJSON(message.data)){
                    switch(JSON.parse(message.data).type){
                        case "room.check": {
                            var x = new xmlhr.XMLHttpRequest();
                            var b = true;
                            x.open("GET", `${conf.endpoints.jgames.protocol}${conf.endpoints.jgames.endpoints.ecast}${conf.endpoints.jgames.address}${conf.endpoints.jgames.avaliable.rooms}${JSON.parse(message.data).room}`);
                            ws_client.send(JSON.stringify({
                                return_type: "debug",
                                returned: {
                                    type: 0,
                                    msg: `request "${conf.endpoints.jgames.protocol}${conf.endpoints.jgames.endpoints.ecast}${conf.endpoints.jgames.address}${conf.endpoints.jgames.avaliable.rooms}${JSON.parse(message.data).room}"`
                                }
                            }));
                            x.setRequestHeader("Content-Type", "application/json");
                            x.onreadystatechange = () => {
                                if(checkJSON(x.responseText) && b){
                                    ws_client.send(JSON.stringify({
                                        return_type: "room.check",
                                        returned: JSON.parse(x.responseText),
                                        args: [JSON.parse(message.data).args[0], JSON.parse(message.data).args[1]]
                                    }));
                                    ws_client.send(JSON.stringify({
                                        return_type: "debug",
                                        returned: {
                                            type: 0,
                                            msg: `request successful`
                                        }
                                    }));
                                    b = false;
                                }
                            }
                            x.send();
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
        this.is_room = (room = "", username = "", password = "") => {
            if(is_ready) last_connection.send(JSON.stringify({type: "room.check", room: room, args: [username, password]}));
        }

        /**
         * Connect to room
         * @param {Room} room Room
         */
        this.connect = (room) => {
            var websockets = require('ws');
            //console.log(`wss://${room.endpoint_player}${config.endpoints.jgames.avaliable.rooms}${room.room}/play?role=${room.joinas}&name=${room.player_name}&format=json&user-id=${room.uid}`)
            var room_connection = new websockets(`wss://${room.endpoint_player}${config.endpoints.jgames.avaliable.rooms}${room.room}/play?role=${room.joinas}&name=${room.player_name}&format=json&user-id=${room.uid}`, "ecast-v0");
            var xmlhr = require("xmlhttprequest");
            room_connection.on("message", (t, a) => {
                //console.log(t.toString());
            })
        }

        /**
         * **Init event loop**
         */
        this.run_events = () => {
            var event_task = new taskjs();
            run_server(this);
            event_task.run(this.event_loop, dir, config);
            /**
            * @event JAPI#debug
            * @param {Object} msg Debug message
            */
            this.emit("debug", {
                type: 1,
                msg: "events are ready to run"
            });
        }
    }
}

module.exports = {
    JAPI: JAPI,
    Room: Room
}