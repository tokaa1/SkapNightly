localStorage.removeItem("username");
localStorage.removeItem("password");
localStorage.removeItem("cookie");

for (let i of exitPowerRewards) {
    i.addEventListener("click", () => {
        hide(i.parentNode);
    });
}
for (let i of exitHatRewards) {
    i.addEventListener("click", () => {
        hide(i.parentNode);
    });
}

var keysDown = new Set();
document.addEventListener("keydown", e => {
    if (e.repeat) return;
    if (e.target instanceof HTMLInputElement) return;
    if (e.ctrlKey) return;
    keysDown.add(e.key?.toLowerCase());
});
document.addEventListener("keyup", e => {
    keysDown.delete(e.key?.toLowerCase());
});

/* const clientWS = new ClientWS("wss://skapclientserver.nky5223.repl.co");
clientWS.init();
clientWS.onmessage = onClientMessage;
clientWS.onopen = onClientOpen;
clientWS.onclose = onClientClose; */
var webbysocket;

var pauseMenuOpen = false;

var power1Value;
var power2Value;

function connect() {
    webbysocket = new WebSocket("wss://skap.io");
    webbysocket.binaryType = "arraybuffer";
    webbysocket.onclose = () => console.error("websocket closed");
}

connect();

/**
 * @param {Object} m
 * @param {Object} m.infos
 * @param {string} m.infos.id
 * @param {number} m.infos.fuel
 * @param {number | null} m.infos.oneCooldown
 * @param {number | null} m.infos.twoCooldown
 * @param {number} m.infos.oneHeat
 * @param {number} m.infos.twoHeat
 * @param {Object<string, Player>} m.players id:Player
 * @param {[string, string, boolean, boolean][]} m.playerList name, area, dea
 * d, freeze
 * @param {SkapEntity[]} m.entities
 * @param {Object[]} m.particles
 */
function updateStates(m) {
    let now = Date.now();
    let diff = now - lastUpdate;
    let calcTPS = 1000 / diff;
    TPSDisplay.innerHTML = calcTPS.toFixed(2);
    TPSHistory.push({ time: now, tps: calcTPS });
    if (TPSHistory.length > 100 || TPSHistory[TPSHistory.length - 1].time - TPSHistory[0].time > 1150) TPSHistory.splice(0, 1);
    lastUpdate = now;

    let player = m.players[m.infos.id];
    /* sendWs({
        e: "username",
        username: player.name
    }, clientWS);
    sendWs({
        e: "fuel",
        user: player.name,
        fuel: player.fuel
    }, clientWS); */

    power0CD.style.height = (isNaN(m.infos.oneCooldown) ? 0 : m.infos.oneCooldown) * 100 + "%";
    power1CD.style.height = (isNaN(m.infos.twoCooldown) ? 0 : m.infos.twoCooldown) * 100 + "%";
    power0Heat.style.height = m.infos.oneHeat * 100 + "%";
    power1Heat.style.height = m.infos.twoHeat * 100 + "%";

    /* sendWs({
        e: "cooldown",
        slot: 0,
        cooldown: m.infos.oneCooldown
    }, clientWS);
    sendWs({
        e: "cooldown",
        slot: 1,
        cooldown: m.infos.twoCooldown
    }, clientWS);
    sendWs({
        e: "heat",
        slot: 0,
        heat: m.infos.oneHeat
    }, clientWS);
    sendWs({
        e: "heat",
        slot: 1,
        heat: m.infos.twoHeat
    }, clientWS); */

    // Death/Freeze message
    if (player.states.includes("Died")) {
        show(deathM);
        hide(freezeM);
        //power0.disabled = true;
        //power1.disabled = true;
    } else {
        hide(deathM);
        if (player.states.includes("Freeze")) show(freezeM);
        else hide(freezeM);
        //power0.disabled = false;
        //power1.disabled = false;
    };
    document.title = `SkapNightly${player.states.includes("Died") ? " <Dead>" : player.states.includes("Freeze") ? " <Frozen>" : ""}`

    // List players
    while (playerList.firstChild) {
        playerList.firstChild.remove();
    }
    for (let p of m.playerList) {
        const el = document.createElement("p");
        if (p[2]) el.classList.add("deadPlayerName");
        if (p[3]) el.classList.add("freezePlayerName");
        // if (p[0] in SkapClientPlayers) el.classList.add("skapclientPlayerName")
        el.innerHTML = p[0].safe() + ":&nbsp;" + p[1].safe();
        /*var color = [0, 0, 0];
        for (let [uuid, player] of Object.entries(m.players)) {
            if (player.name == p[0]) {
                color = player.color;
                break;
            }
        }
        el.style = "color: rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ");";*/
        
        playerList.appendChild(el);
    }
    // Fuel bar 
    fuelBar.style.width = 100 * m.infos.fuel / 10 + "%";
    // Pos and vel
    posXSpan.innerHTML = player.pos.x;
    posYSpan.innerHTML = player.pos.y;
    let vel = Math.sqrt(player.vel.x * player.vel.x + player.vel.y * player.vel.y);
    velSpan.innerHTML = vel.toFixed(3);
    velXSpan.innerHTML = player.vel.x;
    velYSpan.innerHTML = player.vel.y;

    //Update last position values
    for (let [k, v] of Object.entries(m.players)) {
        let newPlayer = m.players[k];
        let oldPlayer;
        if (state == null || state.players == null || (oldPlayer = state.players[k]) == null) {
            newPlayer.lastPos = newPlayer.pos;
        } else
            newPlayer.lastPos = oldPlayer.pos;
        m.players[k] = newPlayer;//might be unneeded
    }

    // Camera
    /*if (!freeCam) {
        var intpPos = getInterpolatedPos(player.lastPos, player.pos);
        camX = player.pos.x;
        camY = player.pos.y;
    }*/

    // Set entities
    state = m;
    // Particles
    if (document.hasFocus()) {
        for (let p of m.particles) {
            switch (p.type) {
                case "dash":
                    particles.dash.push({
                        x: p.x,
                        y: p.y,
                        vx: -Math.cos(p.dir),
                        vy: -Math.sin(p.dir),
                        r: 5,
                        o: 1
                    });
                    break;
                case "shrinking":
                    for (let i = 0; i < 20; i++) {
                        let dir = Math.random() * (Math.PI + 1) - 0.5;
                        let s = Math.random() / 4 + 0.5;
                        particles.shrink.push({
                            r: 2,
                            x: p.x,
                            y: p.y,
                            vx: s * Math.cos(dir),
                            vy: -s * Math.sin(dir)
                        });
                    }
                    break;
                case "bombExplosion":
                    for (let i = 0; i < 100; i++) {
                        let rStart = p.region * Math.random() / 2;
                        let dir = 2 * Math.PI * Math.random();
                        particles.bomb.push({
                            o: 1,
                            x: p.x + rStart * Math.cos(dir),
                            y: p.y + rStart * Math.sin(dir),
                            vx: p.region * Math.cos(dir) / 50,
                            vy: p.region * Math.sin(dir) / 50
                        });
                    }
                    break;
                case "explosion":
                    particles.explosion.push({
                        x: p.x,
                        y: p.y,
                        r: 0,
                        o: 1
                    });
                    break;
                case "healing":
                    let dir = 2 * Math.PI * Math.random();
                    particles.ghost.push({
                        x: p.x,
                        y: p.y,
                        vx: Math.cos(dir) / 5,
                        vy: Math.sin(dir) / 5,
                        r: 1.5,
                        o: 1
                    });
                    break;
                case "refuel":
                    for (let i = 0; i < 20; i++) {
                        let dir = Math.random() * 2 - Math.PI / 2 - 1;
                        let s = Math.random() / 5 + 0.3;
                        particles.refuel.push({
                            x: p.x,
                            y: p.y,
                            vx: s * Math.cos(dir),
                            vy: -s * Math.sin(dir),
                            o: 1
                        });
                    }
                    break;
            }
        }
        for (let id in m.players) {
            let p = m.players[id];
            if (p.states.includes("jetpack")) {
                for (let i = 0; i < 5; i++) {
                    let dir = Math.random() * -Math.PI + Math.PI / 2 * p.gravDir;
                    let s = Math.random() / 10 + 0.1;
                    particles.jetpack.push({
                        x: p.pos.x,
                        y: p.pos.y,
                        vx: -s * Math.cos(dir),
                        vy: -s * Math.sin(dir),
                        hue: 0,
                        s: 100,
                        w: p.gravDir === 0 || p.gravDir === 2 ? 5 : 2,
                        h: p.gravDir === 0 || p.gravDir === 2 ? 2 : 5,
                        o: 1
                    });
                }
            }
            if ((p.vel.x * p.vel.x + p.vel.y * p.vel.y) > 25 && Math.random() < 0.5) {
                let dir = Math.random() * Math.PI * 2;
                let s = Math.random() / 20 + 0.05;
                particles.trail.push({
                    x: p.pos.x + (p.radius - 1) * Math.cos(dir),
                    y: p.pos.y + (p.radius - 1) * Math.sin(dir),
                    vx: s * Math.cos(dir),
                    vy: s * Math.sin(dir),
                    o: 0.75
                });
            }
        }
    }
}

//}
/**
 * @param {SkapMap} i 
 */
function initMap(i) {
    map.color = i.backgroundColor instanceof Array && i.backgroundColor.length > 3 ? "rgb(" +
        (240 + (i.backgroundColor[0] - 240) * i.backgroundColor[3]) + ", " +
        (240 + (i.backgroundColor[1] - 240) * i.backgroundColor[3]) + ", " +
        (240 + (i.backgroundColor[2] - 240) * i.backgroundColor[3]) + ")"
        : "rainbow";
    map.background = fromColArr(i.areaColor);
    map.areaSize = i.areaSize;
    map.obstacle = [];
    map.movingObstacle = [];
    map.circularObstacle = [];
    map.teleporter = [];
    map.lava = [];
    map.rotatingLava = [];
    map.movingLava = [];
    map.circularLava = [];
    map.ice = [];
    map.movingIce = [];
    map.circularIce = [];
    map.slime = [];
    map.movingSlime = [];
    map.circularSlime = [];
    map.button = [];
    map.switch = [];
    map.door = [];
    map.block0 = [];
    map.image0 = [];
    map.text = [];
    map.turret = [];
    map.reward = [];
    map.hatReward = [];
    map.box = [];
    map.gravityZone = [];
    map.block1 = [];
    map.image1 = [];
    for (let o of i.objects) {
        switch (o.type) {
            case "block":
                o.color = fromColArr(o.color.concat(o.opacity));
                if (o.layer) {
                    map.block1.push(o);
                } else {
                    map.block0.push(o);
                }
                break;
            case "obstacle":
            case "slime":
            case "ice":
            case "lava":
            case "box":
            case "turret":
            case "circularObstacle":
            case "circularLava":
            case "circularIce":
            case "circularSlime":
                map[o.type].push(o);
                break;
            case 1:
                map.movingLava.push(o);
                break;
            case 2:
                map.movingObstacle.push(o);
                break;
            case 3:
                map.movingIce.push(o);
                break;
            case 4:
                map.movingSlime.push(o);
                break;
            case "teleporter":
                o.dir = (o.dir ?? 0).toString();
                map.teleporter.push(o);
                break;
            case "gravityZone":
                o.dir = (o.dir ?? 4).toString();
                map.gravityZone.push(o);
                break;
            case "button":
                o.dir = (o.dir ?? 0).toString();
                o.points = [
                    [
                        o.pos.x + (o.dir === "0" ? o.size.x * 0.1 : 0),
                        o.pos.y + (o.dir === "3" ? o.size.y * 0.1 : 0)
                    ],
                    [
                        o.pos.x + (o.dir === "0" ? o.size.x * 0.9 : o.size.x),
                        o.pos.y + (o.dir === "1" ? o.size.y * 0.1 : 0)
                    ],
                    [
                        o.pos.x + (o.dir === "2" ? o.size.x * 0.9 : o.size.x),
                        o.pos.y + (o.dir === "1" ? o.size.y * 0.9 : o.size.y)
                    ],
                    [
                        o.pos.x + (o.dir === "2" ? o.size.x * 0.1 : 0),
                        o.pos.y + (o.dir === "3" ? o.size.y * 0.9 : o.size.y)
                    ]
                ];
                map.button.push(o);
                break;
            case "switch":
                o.dir = (o.dir ?? 0).toString();
                o.points = [
                    [
                        o.pos.x - (o.dir === "3" && !o.switch ? 2 : 0),
                        o.pos.y - (o.dir === "0" && o.switch ? 2 : 0)
                    ],
                    [
                        o.pos.x + (o.dir === "1" && o.switch ? 2 : 0) + o.size.x,
                        o.pos.y - (o.dir === "0" && !o.switch ? 2 : 0)
                    ],
                    [
                        o.pos.x + (o.dir === "1" && !o.switch ? 2 : 0) + o.size.x,
                        o.pos.y + (o.dir === "2" && o.switch ? 2 : 0) + o.size.y
                    ],
                    [
                        o.pos.x - (o.dir === "3" && o.switch ? 2 : 0),
                        o.pos.y + (o.dir === "2" && !o.switch ? 2 : 0) + o.size.y
                    ]
                ];
                map.switch.push(o);
                break;
            case 0:
                o.angle = o.angle * Math.PI / 180;
                map.rotatingLava.push(o);
                break;
            case "reward":
                o.image = renderSettings.textures.powers[o.reward] || renderSettings.textures.powers[11];
                map.reward.push(o);
                break;
            case "hatReward":
                o.image = (renderSettings.textures.hats[o.reward] || renderSettings.textures.hats.none).texture;
                map.hatReward.push(o);
                break;
            case "text":
                let split = o.text.split("|");
                if (split[0] === "SKAPCLIENT.IMAGE") {
                    if (split[1].startsWith("http")) break;
                    if (split[6] === "true" || split[6] === "1") {
                        map.image1.push({
                            image: loadImage(split[1]),
                            pos: {
                                x: isNaN(split[2]) ? 0 : parseInt(split[2]),
                                y: isNaN(split[3]) ? 0 : parseInt(split[3])
                            },
                            size: {
                                x: isNaN(split[4]) ? 0 : parseInt(split[4]),
                                y: isNaN(split[5]) ? 0 : parseInt(split[5])
                            },
                            layer: 1
                        });
                    } else {
                        map.image0.push({
                            image: loadImage(split[1]),
                            pos: {
                                x: isNaN(split[2]) ? 0 : parseInt(split[2]),
                                y: isNaN(split[3]) ? 0 : parseInt(split[3])
                            },
                            size: {
                                x: isNaN(split[4]) ? 0 : parseInt(split[4]),
                                y: isNaN(split[5]) ? 0 : parseInt(split[5])
                            },
                            layer: 0
                        });
                    }
                    if (split[7] === "true" || split[7] === "1") {
                        map.text.push(o);
                    }
                } else {
                    map.text.push(o);
                }
                break;
        }
    }
    for (let o of i.objects) {
        if (o.type === "door") {
            o.linkIdsOn = [];
            o.linkIdsOff = [];
            o.linksOn = [];
            o.linksOff = [];
            for (let l of o.linkIds) {
                l = parseInt(l, 10);
                if (l < 0) {
                    o.linkIdsOff.push(-l);
                } else {
                    o.linkIdsOn.push(l);
                }
            }
            for (let b of map.button) {
                if (o.linkIdsOn.includes(Math.floor(b.linkId))) {
                    o.linksOn.push(b);
                } else if (o.linkIdsOff.includes(Math.floor(b.linkId))) {
                    o.linksOff.push(b);
                }
            }
            for (let s of map.switch) {
                if (o.linkIdsOn.includes(Math.floor(s.linkId))) {
                    o.linksOn.push(s);
                } else if (o.linkIdsOff.includes(Math.floor(s.linkId))) {
                    o.linksOff.push(s);
                }
            }
            map.door.push(o);
        }
    }
    // Remove particles
    particles.dash = [];
    particles.shrink = [];
    particles.bomb = [];
    particles.explosion = [];
    particles.ghost = [];
    particles.refuel = [];
    particles.jetpack = [];
    particles.trail = [];
}
/**
 * 
 * @param {Object} msg 
 * @param {string} msg.s Author
 * @param {-2 | -1 | 0 | 1} msg.r Discord / Guest / User / Mod
 * @param {string} msg.m Message
 * @param {boolean} force Force message
 */
function message(msg, force = false) {
    if (msg.s === "[SKAP]" && !msg.r === -2 && hideSKAP) return;
    if (!force && blocked.includes(msg.s) && !devs.includes(msg.s)) {
        // message({
        //     s: msg.s,
        //     r: msg.r,
        //     m: "<i>[Blocked]</i>"
        // }, true);
        return;
    }
    // Chat bubbles
    if (!showChat && !blocked.includes(msg.s)) {
        chatMsgs[msg.s] = { m: checkProfanityString(msg.m), t: 300 };
    }

    //Play ping sound if messasge contains one
    if (msg && msg.m && msg.m.match(new RegExp("@" + user + "(\\s|$)", "g")) || (msg.m.match(/@devs(\s|$)/g) && devs.includes(user))) mention.play();

    let scroll = chat.lastElementChild ? chat.scrollTop + chat.clientHeight + 6 >= chat.scrollHeight : true;
    //Create div to put the message in
    let wrapper = document.createElement("div");
    wrapper.className = "wrapper";
    let p = document.createElement("p");
    //Set style for the type of message
    p.className = (msg.r === -2)
        ? "discordMsg"
        : msg.s === "[SKAP]" || msg.s === "[CLIENT]"
            ? "SYSMsg"
            : msg.s.startsWith("[/msg] ")
                ? "msgMsg"
                : ["guestMsg", "userMsg", "modMsg"][msg.r + 1];

    //Add rainbow styling for devs, remove profanity, add <a> for links, and add timestamp
    p.innerHTML = `<span class="
    ${msg.r === -2
            ? ""
            : devs.includes(msg.s)
                ? "devMsg"
                : msg.s === "Whiz"
                    ? "whizmsg"
                    : msg.s === "Wish"
                        ? "wishmsg"
                        : msg.s === "VoidMohy"
                            ? "modMsg"
                            : ""
        }">
        ${force
            ? msg.s
            : checkProfanityString(msg.s.safe())
        }:&nbsp;</span>
        ${force
            ? msg.m.replace(URLRegex, '<a href="$1" target="_blank">$1</a>').replace(EmailRegex, '<a href="mailto:$1" target="_blank">$1</a>')
            : checkProfanityString(msg.m.safe().replace(URLRegex, '<a href="$1" target="_blank">$1</a>').replace(EmailRegex, '<a href="mailto:$1" target="_blank">$1</a>'))
        }<span class="timestamp">${(function getTimestamp() {
            let now = new Date();
            function fillZeros(num) {
                return "0".repeat(2 - (num = String(num)).length) + num;
            }
            return now.getHours() + ":" + fillZeros(now.getMinutes());
        })()}</span>`;
    wrapper.appendChild(p);
    chat.appendChild(wrapper);
    if (scroll) p.scrollIntoView();

    return p;
}
/**
 * @param {string} str 
 */
function checkProfanityString(str) {
    for (let i of seriousProfanCheck) {
        str = str.replace(new RegExp(i, "gi"), "*".repeat(i.length));
    }
    if (censor === "heavy") {
        for (let i of profanCheck) {
            str = str.replace(new RegExp(i, "gi"), "*".repeat(i.length));
        }
    }
    return str;
}

/**
 * @param {string} msg 
 */
function sendMessage(msg) {
    msg = String(msg);
    // Test for n-words and stuff
    for (let i of seriousProfanCheck) {
        if (msg.toLowerCase().match(new RegExp("(^|\\s)" + i, "gi"))) {
            //ban(`For attempting to say ${i[0] + "*".repeat(i.length - 1)} in chat`, 3600000);
            // Quick fix for words like c*nt. Also, ban is useless because its implementation is all local.
            return;
        }
    }
    // emojis
    msg = Object.entries(emojiList).reduce((m, [i, { char, regex }]) => m.replace(regex, char), msg);
    // ping
    if (msg.toLowerCase() === "ping") {
        if (pingTime) {
            message({
                s: "[CLIENT]",
                r: 0,
                m: "Already pinged, please just wait."
            });
            return;
        } else {
            pingTime = Date.now();
        }
    }
    sendWs({
        e: "message",
        message: msg
    });
}
function keys(key = 0, value = true) {
    sendWs({
        e: "input",
        input: {
            keys: key,
            value: value ? true : false
        }
    });

    if (value) overlays[key]?.classList?.add("overlayactive");
    else overlays[key]?.classList?.remove("overlayactive");
}
function changePower(slot = 0, power = 0) {
    if (state.players[state.infos.id].states.includes("Died")) return;
    power = Number(power);
    if (!powers.has(power)) return;
    /*if (slot) {
        if (power == power0.value) {
            power0.value = power1.value;
            sendWs({
                e: "powerChange",
                m: 0,
                i: Number(power0.value)
            });
            sendWs({
                e: "power",
                slot: 0,
                power: Number(power0.value)
            }, clientWS);
        }
        power1.value = power;
    } else {
        if (power == power1.value) {
            power1.value = power0.value;
            sendWs({
                e: "powerChange",
                m: 1,
                i: Number(power1.value)
            });
            sendWs({
                e: "power",
                slot: 1,
                power: Number(power1.value)
            }, clientWS);
        }
        power0.value = power;
    }*/
    if (slot == 0 && power == power2Value)
        power2Value = power1Value;
    else if (slot == 1 && power == power1Value)
        power1Value = power2Value;

    if (slot == 0)
        power1Value = power;
    else if (slot == 1)
        power2Value = power;

    sendWs({
        e: "powerChange",
        m: slot ? 1 : 0,
        i: Number(power)
    });
    /* sendWs({
        e: "power",
        slot: slot ? 1 : 0,
        power: Number(power)
    }, clientWS); */

    updatePowerIcon(power0Img, power1Value);
    updatePowerIcon(power1Img, power2Value);
}
function togglePauseMenu() {
    pauseMenuOpen = !pauseMenuOpen;
    if (pauseMenuOpen) {
        show(loginDiv);
        show(pauseGameDiv);
    } else {
        hide(loginDiv);
        hide(createGameMenu);
        hide(pauseGameDiv);
        hide(settingsDiv);
        hide(gamesDiv);
        showingSettings = false;
        loadSettings();
    }
}
function aim(x = 0, y = 0) {
    sendWs({
        e: "aim",
        m: [
            x,
            y
        ]
    });
}
webbysocket.addEventListener("close", () => {
    canSend = false;
    //hide(gameDiv);
    //document.title = "Disconnected";
    //customAlert("The WebSocket closed for unknown reasons.<br>Please reload the client. If that doesn't work, try again later.<br>Skap may have been taken down for maintenance", Infinity);
});
document.addEventListener("keydown", e => {
    if (!e.repeat && e.key?.toLowerCase() === "p") {
        if (showChat) {
            showChat = false;
            customAlert("Chat in bubble mode");
            hide(chat);
        } else {
            showChat = true;
            customAlert("Chat in div mode");
            show(chat);
            chat.lastElementChild.scrollIntoView();
        }
    }
});
