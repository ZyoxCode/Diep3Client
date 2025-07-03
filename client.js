const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');
const socket = io('https://diep3server.oggyp.com', {
    withCredentials: true
});
window.onload = () => {
    const chatbox = document.getElementById("chatbox");
}

const saved = JSON.parse(sessionStorage.getItem('formData') || '{}');
if (saved.text != '') {

    socket.emit('setUsername', { 'username': saved.text })
}

document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;

let ratio = canvas.width / canvas.height
let xView = 110 // Will change based on size later
let viewDecay = 0.5

let yView = xView / ratio
let GSRatio = xView / (canvas.width / 2)

let maxYView = xView * (9 / 16)
let baseMaxYView = xView * (9 / 16)

let maxXView = 110
let baseMaxXView = 110


let playerX = 0;
let playerY = 0;
let playerScore = 0;
let playerSize = 0;
let id = 0;

let starting_score = 0
let starting_size = 0

const keys = {};

let players = {};
let projectiles = [];
let polygons = {};
let immovables = []; // might just group in with polygons
let upgradeOptions = [];
let currentChatMessages = {}

let eWasJustPressed = false;
let leaderboard = {};
let FLASH_LAMBDA = 2;

// Sample upgrade format
let defaultUpgrades = [
    { 'name': 'Bullet Damage', 'level': 0, 'color': 'squareYellow' },
    { 'name': 'Max Health', 'level': 0, 'color': 'playerBlue' },
]


class Game {
    constructor(mapSize, gridLines, gridInterval, starting_score, starting_size) {
        this.mapSize = mapSize
        this.gridLines = gridLines
        this.gridInterval = gridInterval
        this.starting_score = starting_score
        this.starting_size = starting_size

    }
}

let game = new Game(0, 0, 0, 0, 0)


function changeTankPrompt() {
    var tankName = prompt("Tank:")

    socket.emit('changeTankRequest', { 'name': tankName })

}

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (!ui.isChatBoxOpen) {
        evaluateMovement()
    }

    if (!ui.isChatBoxOpen) {
        if (e.code == "KeyE") {
            eWasJustPressed = true;
        } else if (e.code == "KeyT") {
            changeTankPrompt()
        }
    }

    // if (e.code == 'Minus') {
    //     baseMaxXView += 10;
    //     maxXView += 10;
    // } else if (e.code == 'Equal') {
    //     baseMaxXView += -10
    //     maxXView += -10
    // }

    if (e.code == "Enter") {
        if (ui.isChatBoxOpen) {
            ui.isChatBoxOpen = false

            chatbox.style.setProperty('visibility', 'hidden')
            let text = chatbox.value
            socket.emit("sendChatMessage", text)
            chatbox.value = ""

        } else {
            socket.emit("moveStop", { "id": id })
            ui.isChatBoxOpen = true

            chatbox.style.setProperty('visibility', 'visible')
            chatbox.focus();
            chatbox.select();
        }
    }

    if (e.code == "Escape") {
        if (ui.isChatBoxOpen) {
            ui.isChatBoxOpen = false
            chatbox.style.setProperty('visibility', 'hidden')
        }
    }
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (!ui.isChatBoxOpen) {
        evaluateMovement()
    }


    if (e.code == "KeyE") {
        if (eWasJustPressed == true) {
            eWasJustPressed = false;
            socket.emit("autoFireToggle", {})
        }
    }
});

var mouse = {
    X: canvas.width / 2,
    Y: canvas.height / 2,
}

window.addEventListener('mousemove', e => {

    mouse.X = e.clientX;
    mouse.Y = e.clientY;

    socket.emit("mouseMove", { "angle": Math.atan2(mouse.X - canvas.width / 2, mouse.Y - canvas.height / 2) + Math.PI, "mousePos": { 'x': gameX(mouse.X), 'y': gameY(mouse.Y) }, "id": id })

});

window.addEventListener('mousedown', e => {
    if (e.button == 0) {
        let uReqResponse = ui.checkUpgradeRequest(canvas, mouse)
        if (uReqResponse != 'None') {

            socket.emit("upgradeRequest", uReqResponse)
        }

        if (players[id].allowedUpgrade == true) {
            uReqResponse = ui.checkTankUpgradeRequest(mouse)
            //console.log(uReqResponse)
            if (uReqResponse != 'None') {
                socket.emit("tankUpgradeRequest", uReqResponse)
            }
        }

        socket.emit("requestingFire", {})
    }
    else if (e.button == 2) {
        socket.emit("activateReverser", {})
    }


})

window.addEventListener('mouseup', e => {
    if (e.button == 0) {
        socket.emit("requestingCeaseFire", {})
    } else if (e.button == 2) {
        socket.emit("cancelReverser", {})
    }

})



function evaluateMovement() {
    let x = 0;
    let y = 0;
    if (keys.KeyW) {
        y += 1
    }
    if (keys.KeyS) {
        y -= 1
    }
    if (keys.KeyD) {
        x += -1
    }
    if (keys.KeyA) {
        x += 1
    }
    if (x == 0 && y == 0) {
        socket.emit("moveStop", { "id": id })
    } else {
        socket.emit("moveReq", { "moveReqAngle": Math.atan2(y, x), "id": id })
    }
}



socket.on('init', (data) => {
    console.log('Received initial game state:', data);
    id = data.id

    game.mapSize = data.map_size
    game.gridInterval = data.grid_interval

    game.starting_score = data.starting_score
    game.starting_size = data.starting_size

    playerX = data.x
    playerY = data.y

    console.log('Map Size:', game.mapSize)
    console.log('Initial Player Position: (', playerX, ',', playerY, ')')

    game.gridLines = makeGrid(game.mapSize)
    console.log(players)
    console.log(game)

    drawGrid(game.gridLines)

});

socket.on('gameState', (data) => { // I think in here we just put updating variables and then have a seperate loop for rendering
    //console.log(data.leaderboard)
    for (let id1 in data.players) {

        if (!(id1 in players)) {
            players[id1] = data.players[id1]
        } else {
            for (let stat in data.players[id1]) {
                players[id1][stat] = data.players[id1][stat]
            }
        }
    }

    for (let id1 in data.polygons) {

        if (!(id1 in polygons)) {
            polygons[id1] = data.polygons[id1]
        } else {

            for (let stat in data.polygons[id1]) {
                polygons[id1][stat] = data.polygons[id1][stat]
            }
        }
    }

    for (let id1 in data.leaderboard) {

        if (!(Object.keys(leaderboard).includes(id1))) {
            leaderboard[id1] = data.leaderboard[id1]
        } else {

            for (let stat in data.leaderboard[id1]) {

                leaderboard[id1][stat] = data.leaderboard[id1][stat]
            }
        }
    }

    for (let id1 in leaderboard) {
        if (!Object.keys(data.leaderboard).includes(id1)) {

            delete leaderboard[id1]
        }
    }



    for (let id1 in players) {
        if (!data.fullPlayerList.includes(id1)) {
            delete players[id1]
        }
    }

    for (let id1 in polygons) {
        if (!data.fullPolygonList.includes(id1)) {
            delete polygons[id1]
        }
    }

    for (let message of data.chatMessages) {
        if (!Object.keys(currentChatMessages).includes(message.id)) {
            currentChatMessages[message.id] = []
            currentChatMessages[message.id].push({ 'text': message.message, 'timer': ui.maxBroadcastTime })
        } else {
            currentChatMessages[message.id].push({ 'text': message.message, 'timer': ui.maxBroadcastTime })
        }
    }

    playerX = players[id].position.x
    playerY = players[id].position.y
    playerScore = players[id].score
    playerAngle = players[id].rotation
    playerSize = players[id].size
    projectiles = data.projectiles
    immovables = data.immovables
    // leaderboard = data.leaderboard
    ui.upgrades = players[id].skillUpgrades;


});

socket.on('addBroadcast', (data) => {
    ui.addBroadcast(data.text);
});

socket.on('updateUpgrades', (data) => {
    ui.upgrades = data.upgrades;
});

socket.on('updateTankUpgrades', (data) => {

    ui.tankUpgradeOptions = data.options

})

socket.on('playerDisconnected', (data) => {
    delete players[data]
})

function getFlashColor(color, additive) {
    let r1 = color[0]
    let r2 = color[1]
    let r3 = color[2]

    if (r1 + additive > 255) {
        r1 = 255
    } else {
        r1 += additive
    }

    if (r2 + additive > 255) {
        r2 = 255
    } else {
        r2 += additive
    }

    if (r3 + additive > 255) {
        r3 = 255
    } else {
        r3 += additive
    }
    return [r1, r2, r3]
}

function makeGrid() { // Only works for square arenas
    gridLines = []

    for (let i = 0; i <= game.mapSize / game.gridInterval; i++) {

        gridLines.push((-game.mapSize / 2) + game.gridInterval * i)

    };

    return gridLines
}

function drawGrid(gridLines) { // Only works for square arenas

    for (let i in gridLines) {
        ctx.strokeStyle = '#7a7a7a';
        ctx.lineWidth = 0.5;

        if (Math.abs(gridLines[i] - playerX) < xView) {

            if (playerY + yView > (game.mapSize / 2)) {
                end = screenY(game.mapSize / 2)
            } else {
                end = 0
            }

            if (playerY - yView < -game.mapSize / 2) {
                start = screenY(-game.mapSize / 2)
            } else {
                start = canvas.height
            }

            ctx.beginPath();
            ctx.moveTo(screenX(gridLines[i]), start);
            ctx.lineTo(screenX(gridLines[i]), end);
            ctx.stroke();
        }

        if (Math.abs(gridLines[i] - playerY) < yView) {
            if (playerX + xView > game.mapSize / 2) {
                end = screenX(game.mapSize / 2)
            } else {
                end = 0
            }

            if (playerX - xView < -game.mapSize / 2) {
                start = screenX(-game.mapSize / 2)
            } else {
                start = canvas.width
            }

            ctx.beginPath();
            ctx.moveTo(start, screenY(gridLines[i]));
            ctx.lineTo(end, screenY(gridLines[i]));
            ctx.stroke();
        }
    }
}



let colorList = { // eventually move to JSON
    'barrelGrey': { "fill": [172, 172, 172], "stroke": [130, 130, 130] },
    'playerBlue': { "fill": [74, 150, 227], "stroke": [65, 121, 164] },
    'playerRed': { "fill": [232, 83, 72], "stroke": [171, 61, 53] },
    'squareYellow': { "fill": [245, 200, 76], "stroke": [209, 171, 67] },
    'triangleRed': { "fill": [212, 93, 70], "stroke": [168, 73, 54] },
    'pentagonBlue': { "fill": [141, 106, 223], "stroke": [91, 78, 120] },
    'whiteHighlight': { "fill": [230, 230, 230], "stroke": [200, 200, 200] },
    'green1': { "fill": [139, 196, 102], "stroke": [83, 120, 59] },
    'green2': { "fill": [232, 124, 23], "stroke": [83, 120, 59] },
    'hexagonBlue': { "fill": [101, 201, 186], "stroke": [74, 135, 126] },
    'wallGrey': { "fill": [110, 110, 110], "stroke": [84, 84, 84] },
    'borderColor': { "fill": [105, 105, 105], "stroke": [105, 105, 105] },
    'placeholder': { "fill": [], "stroke": [] },
}

let renderList = []

let ui = new UI(colorList)
ui.upgrades = {}


function animationLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;

    ratio = canvas.width / canvas.height
    maxYView = baseMaxYView// / 2 + baseMaxYView * (playerSize / game.starting_size) * viewDecay
    maxXView = baseMaxXView// / 2 + baseMaxXView * (playerSize / game.starting_size) * viewDecay

    //ctx.fillStyle = '#ffffff'
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#dbdbdb'

    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 0);
    ctx.fill();

    if (ratio > 16 / 9) {
        xView = maxXView
        yView = xView / ratio
    } else {
        yView = maxYView
        xView = yView * ratio
    }

    GSRatio = xView / (canvas.width / 2)

    ctx.globalAlpha = 1;
    drawGrid(game.gridLines)

    ctx.lineWidth = 1 / GSRatio;
    for (let proj of projectiles) {
        projectileRender(proj, ctx);
    }

    for (let id in polygons) {
        //console.log(id)
        poly = polygons[id]

        polygonRenderer(poly, ctx)
        if (poly.hp > 0 && poly.hp / poly.maxHp != 1) {

            ctx.strokeStyle = "#4f4f4f";
            ctx.lineWidth = 0.6 / GSRatio;
            ctx.beginPath();
            ctx.roundRect(screenX(poly.position.x) - 7 * poly.size, screenY(poly.position.y) + 8 + 10 * poly.size, 14 * poly.size, 4, 2)
            ctx.stroke();
            ctx.closePath();

            if (poly.hp / poly.maxHp >= 0.7) {
                ctx.fillStyle = "#a7db76";
                //ctx.strokeStyle = "#a7db76";
            } else if (poly.hp / poly.maxHp >= 0.4) {
                ctx.fillStyle = "#e3d368";
                //ctx.strokeStyle = "#e3d368";
            } else {
                ctx.fillStyle = "#d65440";
                //ctx.strokeStyle = "#d65440";
            }

            ctx.lineWidth = 0.6 / GSRatio;
            ctx.beginPath();

            ctx.roundRect(screenX(poly.position.x) - 7 * poly.size, screenY(poly.position.y) + 8 + 10 * poly.size, 14 * poly.size * (poly.hp / poly.maxHp), 4, 2)
            ctx.fill();

            ctx.closePath();
            ctx.lineWidth = 1 / GSRatio;
        }
    }

    for (let i in players) {


        curPlayer = players[i]

        ctx.fillStyle = "#969696";
        ctx.strokeStyle = "#757575";
        ctx.lineWidth = 1 / GSRatio;

        renderList = []
        tankRenderer(curPlayer, ctx)


        for (let object of renderList) {
            //console.log(object)


            if (object.color == 'playerBlue' && id != players[i].id) {
                object.color = 'playerRed';
            }
            renderShape(object.shape, object.offset, object.rotation, object.color, object.sizeMultiplier, players[i].flashTimer, players[i].fadeTimer)
        }
        //console.log(players[id])

        if (curPlayer.hp > 0 && curPlayer.hp / curPlayer.maxHp != 1) {

            ctx.strokeStyle = "#4f4f4f";
            ctx.lineWidth = 0.6 / GSRatio;
            ctx.beginPath();
            ctx.roundRect(screenX(curPlayer.position.x) - 20, screenY(curPlayer.position.y) + 25 + 7 * curPlayer.size, 40, 4, 2)
            ctx.stroke();
            ctx.closePath();

            if (curPlayer.hp / curPlayer.stats.maxHp >= 0.7) {
                ctx.fillStyle = "#a7db76";
                //ctx.strokeStyle = "#a7db76";
            } else if (curPlayer.hp / curPlayer.stats.maxHp >= 0.4) {
                ctx.fillStyle = "#e3d368";
                //ctx.strokeStyle = "#e3d368";
            } else {
                ctx.fillStyle = "#d65440";
                //ctx.strokeStyle = "#d65440";
            }

            ctx.lineWidth = 0.6 / GSRatio;
            ctx.beginPath();

            ctx.roundRect(screenX(curPlayer.position.x) - 20, screenY(curPlayer.position.y) + 25 + 7 * curPlayer.size, 40 * (curPlayer.hp / curPlayer.stats.maxHp), 4, 2)
            // ctx.moveTo(screenX(poly.position.x + 3), screenY(poly.position.y - 5));
            // ctx.lineTo(screenX(poly.position.x + 3 - 6 * (poly.hp / poly.maxHp)), screenY(poly.position.y - 5))
            //ctx.stroke();
            ctx.fill();

            ctx.closePath();
            ctx.lineWidth = 1 / GSRatio;
        }

        if (curPlayer.id != id) {

            ctx.font = 'bold 16px Ubuntu'
            ctx.fillStyle = 'white'
            ctx.strokeStyle = 'gray'
            ctx.lineWidth = 2;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.strokeText(`${curPlayer.username}`, screenX(curPlayer.position.x), screenY(curPlayer.position.y + 6));
            ctx.fillText(`${curPlayer.username}`, screenX(curPlayer.position.x), screenY(curPlayer.position.y + 6));
            ctx.globalAlpha = 1;
        }

    }

    for (let immovable of immovables) {
        //console.log(immovable)
        ctx.lineWidth = 1 / GSRatio;
        polygonRenderer(immovable, ctx);
    }

    if (id != 0 && id in players) {
        ui.renderLeaderboard(ctx, canvas, leaderboard, id);
        ui.renderScoreBar(ctx, canvas, players[id]);
        ui.renderThisPlayerName(ctx, canvas, players[id].username)
        ui.renderBroadcasts(ctx, canvas);

        ui.renderSkillUpgrades(ctx, canvas, mouse, players[id].allocatablePoints);
        ui.renderMinimap(ctx, canvas, players[id].position, game.mapSize);
        if (players[id].allowedUpgrade == true) {
            ui.renderTankUpgrades(ctx, canvas, mouse);
        }

        ui.renderChat(ctx, canvas);
    }
    requestAnimationFrame(animationLoop);

}
animationLoop();
