
var japi = require("./japi")
var g = new japi.JAPI();

g.on("debug", (message) => {
    console.log(message);
});
g.on("room.check", (s) => {
    console.log(s);
})

g.run_events(g);

setTimeout(() => {
    g.is_room("NSTJ");
}, 1000)