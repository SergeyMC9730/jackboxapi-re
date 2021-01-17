var x = new XMLHttpRequest()
x.open("POST", "http://jackbox.fun/rooms/rd.php");
x.setRequestHeader("Content-Type", "application/json")
console.log(x.response)