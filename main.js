//example program based on jackbox api
var readline = require("readline");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var japi = require("./japi")
var g = new japi.JAPI();

g.on("debug", (message) => {
    //console.log(message);
});
g.on("room.check", (s) => {
    if(s.ok == true){
        console.log("Found room %s", s.body.code);
        console.log("Game selected: %s", s.body.appTag)
    } else {
        console.log("Room not found!")
    }
})

g.run_events();

var user, password, room;
var is_ready;

setTimeout(() => {
    
rl.question("Please, type username\n> ", (str) => {
    user = str;
rl.question("\nPlease, type password (leave blank if no password have provided\n> ", (str) => {
    password = str;
rl.question("\nPlease, type room code\n> ", (str) => {
    room = str;

console.log("Connecting...");
g.is_room(room);

}, 1000)
});
});
});
