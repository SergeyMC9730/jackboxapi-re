//example program based on jackbox api
var readline = require("readline");
var crypto = require("crypto");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var fs = require("fs");
var japi = require("./japi")
var g = new japi.JAPI();

var use_config = false;
var config = {
    room: "KDXC",
    playerName: "Debugger",
    password: ""
}

var filepath = "./debug/current_game_debugger.txt"
var file_data = ""

g.on("debug", (message) => {
    console.log(message);
});
g.on("everything", (message) => {
	file_data += `${message}\n`;
	fs.writeFileSync(filepath, file_data);
})
g.on("room.check", (s) => {
    //console.log(s);
    if (s.is_avaliable) {
        console.log("Found room %s", s.room);
        console.log("Game selected: %s", (typeof g.game_lookuptable[s.game_selected] == "undefined") ? s.game_selected : `${g.game_lookuptable[s.game_selected][0]} (unknown)`);
        g.connect(s)
    } else {
        console.log("Room not found!");
    }
})

g.run_events();

var user, password, room;

setTimeout(() => {
    if(use_config){
        console.log("Using config\nConnecting...");
        g.is_room(config.room, config.playerName, config.password);
    } else {
        rl.question("Please, type username\n> ", (str) => {
            user = str;
            rl.question("\nPlease, type password (leave blank if no password have provided\n> ", (str) => {
                password = str;
                rl.question("\nPlease, type room code\n> ", (str) => {
                    room = str;
    
                    console.log("Connecting...");
                    g.is_room(room, user, password);
                });
            });
        });
    }
}, 1000);
