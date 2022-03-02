var express = require("express");
var path = require("path");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var now;
var data = {
    players: {},
    food: [],
};
var lastResp = {};
var maxPlayers = 100;
var idsFree = [];
for (var i = 0; i < maxPlayers; i++) {
    idsFree.push(maxPlayers - i);
}
var idsBusy = [];
var startMass = 50;
var foodCount = 1600;

app.use(express.static(__dirname));

app.get("/3d/a", (req, res) => {
    res.sendFile(`${__dirname}/3d/index_rofl.html`);
});
app.get("/3d/b", (req, res) => {
    res.sendFile(`${__dirname}/3d/kimnata.html`);
});

io.on("connection", function (socket) {
    if (idsFree.length) {
        var id = idsFree.pop();
        socket.emit("id", id);
        idsBusy.push(id);
        socket.on("disconnect", function () {
            idsBusy.splice(idsBusy.indexOf(id), 1);
            idsFree.push(id);
            delete data.players[id];
        });
        socket.on("msg", function (msg) {
            io.emit("msg", msg);
        });
        socket.on("delete", function (msg) {
            delete data.players[msg];
        });
        socket.on("update", function (message) {
            data.players[message.id] = message;
            lastResp[message.id] = Date.now();
            data.food = data.food.filter(function (item) {
                var bool = false;
                for (var i = 0; i < message.foodEaten.length; i++) {
                    if (message.foodEaten[i].x == item.x && message.foodEaten[i].y == item.y) {
                        bool = true;
                        break;
                    }
                }
                return !bool;
            });
            Object.keys(data.players).forEach(function (key) {
                if (message.playersEaten.includes(key)) {
                    data.players[key].alive = false;
                }
            });
            //data.players[message.id]['mass']+=message.foodEaten.length;
        });
    }
});

function update(data) {
    io.emit("update", data);
}

var temp = [];

function getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function spawnFood() {
    if (data.food.length < foodCount) {
        for (var i = 0; i < 10; i++) {
            temp.push({
                x: Number((Math.random() * 7500).toFixed(0)),
                y: Number((Math.random() * 4500).toFixed(0)),
                color: getRandomColor(),
            });
        }
        data["food"] = data["food"].concat(temp);
        temp = [];
    }
}
setInterval(update, 1000 / 5, data);
setInterval(spawnFood, 1000 / 5);

http.listen(process.env.PORT || 5000);
