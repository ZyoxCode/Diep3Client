const REFERENCE_SIZE = 5;
function roundToDecimalPlaces(number, decimalPlaces) {
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
}
class UI {
    constructor(colorPresets) {
        this.colorPresets = colorPresets;
        this.broadcasts = [];
        this.maxBroadcastTime = 500;
        this.maxChatTime = 1000;

        this.upgradesPanel = { 'width': 300, 'height': 20, 'spaceBetween': 30, 'spaceFromLeft': 20, 'spaceFromBottom': 50 }
        this.maxUpgradeLvl = 9;
        this.upgrades = {};
        this.tankUpgradeOptions = [];
        this.isChatBoxOpen = false;
    }
    presetToColorString(preset) {
        return `rgb(${preset[0]} ${preset[1]} ${preset[2]})`
    }
    makeCurvedBox(ctx, centerX, centerY, width, height, alpha = 0.8, color = 'gray', lineWidth = 0, startFromLeft = false) {
        ctx.lineWidth = lineWidth;

        if (color != 'gray') {

            ctx.fillStyle = this.presetToColorString(this.colorPresets[color].fill)

        } else {
            ctx.fillStyle = color;

        }

        ctx.strokeStyle = this.presetToColorString(this.colorPresets['borderColor'].stroke)

        ctx.globalAlpha = alpha;

        ctx.beginPath();
        if (startFromLeft == false) {
            ctx.roundRect(centerX - width / 2, centerY - height / 2, width, height, height / 2);
        } else {
            ctx.roundRect(centerX, centerY - height / 2, width, height, height / 2);
        }

        ctx.closePath();
        if (lineWidth > 0) {
            ctx.stroke();
        }
        ctx.fill();

        ctx.globalAlpha = 1;

    }
    makeText(ctx, text, centerX, centerY, size, color = 'white', strokeWidth = 3, opacity = 1, strokeColor = 'borderColor') {

        ctx.globalAlpha = opacity;
        ctx.font = `bold ${size}px Ubuntu`
        ctx.fillStyle = color;
        ctx.strokeStyle = this.presetToColorString(this.colorPresets['borderColor'].stroke)
        ctx.lineWidth = strokeWidth;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (strokeWidth > 0) {
            ctx.strokeText(text, centerX, centerY);
        }

        ctx.fillText(text, centerX, centerY);


        ctx.globalAlpha = 1;
    }
    renderLeaderboard(ctx, canvas, leaderboard, playerId) {
        let maxScore = 0;
        let height = 15;
        let width = 260;
        let fontSize = 11;
        let spaceBetween = 22;
        let offsetFromTop = 50;
        let offsetFromRight = 20;

        leaderboard = Object.fromEntries(Object.entries(leaderboard).sort(([, a], [, b]) => a['rank'] - b['rank']))
        if (Object.keys(leaderboard).length > 0) {
            maxScore = leaderboard[Object.keys(leaderboard)[0]].score
        }

        this.makeText(ctx, 'Leaderboard', canvas.width - width / 2 - offsetFromRight, offsetFromTop - 25, 20)
        let j = 0
        for (let i in leaderboard) {

            let entry = leaderboard[i]

            this.makeCurvedBox(ctx, canvas.width - width / 2 - offsetFromRight, offsetFromTop + j * spaceBetween, width, height, 1, 'borderColor', 5);

            let color = 'playerRed'
            if (i == playerId) {
                color = 'playerBlue'
            }
            //console.log(maxScore)
            this.makeCurvedBox(ctx, canvas.width - width - offsetFromRight, offsetFromTop + j * spaceBetween, (width - 10) * (entry.score / maxScore) + 10, height, 1, color, 0, true);

            let displayText = entry.score
            if (parseInt(entry.score) >= 1000) {
                displayText = `${parseInt(entry.score) / 1000}k`
            }

            this.makeText(ctx, `${entry.name} - ${entry.tank}: ${displayText}`, canvas.width - width / 2 - offsetFromRight, offsetFromTop + 1 + j * spaceBetween, fontSize, 'white', fontSize / 5, 1)


            entry.mockup.position.x = gameX(canvas.width - width - offsetFromRight - 20)
            entry.mockup.position.y = gameY(offsetFromTop + j * spaceBetween)
            entry.mockup.color = color

            tankRenderer(entry.mockup, ctx);
            j++;


        }
    }
    renderScoreBar(ctx, canvas, player) {
        this.makeCurvedBox(ctx, canvas.width / 2 - (canvas.width / 3.5) / 2 - 2, canvas.height - 50, (canvas.width / 3.5) + 4, 32, 0.7, 'borderColor', 0, true);
        this.makeCurvedBox(ctx, canvas.width / 2 - (canvas.width / 3.5) / 2, canvas.height - 50, 25 + (canvas.width / 3.5 - 25) * ((player.score - player.lastLevelScore) / (player.nextLevelScore - player.lastLevelScore)), 28, 1, 'squareYellow', 0, true);
        this.makeText(ctx, `Level ${player.level} ${player.tankoidPreset}`, canvas.width / 2, canvas.height - 49, 20, 'white', 5, 1)
    }

    renderThisPlayerName(ctx, canvas, playerName) {
        this.makeText(ctx, playerName, canvas.width / 2, canvas.height - 100, 28, 'white', 5, 1)
    }

    addBroadcast(text) {
        this.broadcasts.push({ 'text': text, 'timer': this.maxBroadcastTime, 'opacity': 1 })
    }

    renderBroadcasts(ctx, canvas) {
        let defaultOpacity = 0.7;
        let spaceBetween = 35;
        let cumulativeYShift = 0;

        let threshold = 5

        for (let i in this.broadcasts) {
            let broadcast = this.broadcasts[i];

            if (broadcast.timer < this.maxBroadcastTime / threshold) {
                cumulativeYShift += spaceBetween * (1 - (broadcast.timer / (this.maxBroadcastTime / threshold)))
                broadcast.opacity = (broadcast.timer / (this.maxBroadcastTime / threshold));
            }
            ctx.font = 'bold 15px Ubuntu'
            const text = broadcast.text;
            const textMetrics = ctx.measureText(text)
            this.makeCurvedBox(ctx, canvas.width / 2, 20 - cumulativeYShift + spaceBetween * i, textMetrics.width + 50, 25, defaultOpacity * broadcast.opacity, 'gray', 0);
            this.makeText(ctx, broadcast.text, canvas.width / 2, 21 - cumulativeYShift + spaceBetween * i, 15, 'white', 0, broadcast.opacity)
        }

        for (let i in this.broadcasts) {
            if (this.broadcasts[this.broadcasts.length - 1 - i].timer <= 0) {
                this.broadcasts.splice(this.broadcasts.length - 1 - i, 1);
            } else {
                this.broadcasts[this.broadcasts.length - 1 - i].timer += -1;
            }
        }
    }

    renderChat(ctx, canvas) {
        let defaultOpacity = 0.7;
        let spaceBetween = 35;
        let threshold = 4.5 / 5
        let endThreshold = 1 / 5

        for (let id in currentChatMessages) {
            if (id in players) {
                let cumulativeYShift = 0;
                let centerBase = [players[id].position.x, players[id].position.y + players[id].size + 5]
                let playerBroadcasts = currentChatMessages[id]
                playerBroadcasts.sort((b, a) => a['timer'] - b['timer']);
                for (let i in playerBroadcasts) {

                    let broadcast = playerBroadcasts[i]

                    if (broadcast.timer > threshold * this.maxChatTime) {
                        cumulativeYShift += spaceBetween * (1 - (broadcast.timer / (this.maxChatTime * threshold)))
                    }

                    if (broadcast.timer < endThreshold * this.maxChatTime) {
                        broadcast.opacity = (broadcast.timer / (this.maxChatTime * endThreshold));
                    }

                    ctx.font = 'bold 16px Ubuntu'
                    const text = broadcast.text;
                    const textMetrics = ctx.measureText(text)
                    this.makeCurvedBox(ctx, screenX(centerBase[0]), screenY(centerBase[1]) - cumulativeYShift - spaceBetween * i, textMetrics.width + 30, 25, defaultOpacity * broadcast.opacity, 'gray', 0);
                    this.makeText(ctx, broadcast.text, screenX(centerBase[0]), screenY(centerBase[1]) - cumulativeYShift - spaceBetween * i + 1, 16, 'white', 0, broadcast.opacity)


                }
                for (let i in playerBroadcasts) {
                    if (playerBroadcasts[playerBroadcasts.length - 1 - i].timer <= 0) {
                        playerBroadcasts.splice(playerBroadcasts.length - 1 - i, 1);
                    } else {
                        playerBroadcasts[playerBroadcasts.length - 1 - i].timer += -1;
                    }
                }
            }

        }
    }

    renderSkillUpgrades(ctx, canvas, mouse, allocatable) {

        let spaceBetween = canvas.width / 85;
        let height = canvas.width / 130;
        let width = canvas.width / 7; // turn this stuff into ui properties
        let spaceFromLeft = this.upgradesPanel.spaceFromLeft;
        let spaceFromBottom = this.upgradesPanel.spaceFromBottom;
        let max = 0;

        for (let i in this.upgrades) {

            this.makeCurvedBox(ctx, spaceFromLeft + width / 2, canvas.height - spaceFromBottom - max * spaceBetween, width, height, 0.8, 'gray', 3)

            if (spaceFromLeft < mouse.X && mouse.X < spaceFromLeft + width && canvas.height - spaceFromBottom - max * spaceBetween - height / 2 < mouse.Y && mouse.Y < canvas.height - spaceFromBottom - max * spaceBetween + height / 2) {
                let j = Math.ceil((mouse.X - 20) / (width / this.maxUpgradeLvl))
                this.makeCurvedBox(ctx, spaceFromLeft, canvas.height - spaceFromBottom - max * spaceBetween, (width / this.maxUpgradeLvl) * j, height, 0.8, 'whiteHighlight', 0, true)
            }
            this.makeCurvedBox(ctx, spaceFromLeft, canvas.height - spaceFromBottom - max * spaceBetween, height, height, 0.8, this.upgrades[i].color, 0, true)

            this.makeCurvedBox(ctx, spaceFromLeft, canvas.height - spaceFromBottom - max * spaceBetween, (width / this.maxUpgradeLvl) * this.upgrades[i].level, height, 0.8, this.upgrades[i].color, 0, true)

            if (spaceFromLeft < mouse.X && mouse.X < spaceFromLeft + width && canvas.height - spaceFromBottom - max * spaceBetween - height / 2 < mouse.Y && mouse.Y < canvas.height - spaceFromBottom - max * spaceBetween + height / 2) {
                let jMax = Math.ceil((mouse.X - 20) / (width / this.maxUpgradeLvl))
                if (jMax < this.upgrades[i].level) {
                    jMax = this.upgrades[i].level
                }
                for (let j = 1; j < jMax;) {
                    ctx.beginPath();
                    ctx.moveTo(spaceFromLeft + (width / this.maxUpgradeLvl) * j, canvas.height - spaceFromBottom - max * spaceBetween - height / 2);
                    ctx.lineTo(spaceFromLeft + (width / this.maxUpgradeLvl) * j, canvas.height - spaceFromBottom - max * spaceBetween + height / 2);
                    ctx.closePath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#6e6e6e';
                    ctx.stroke();
                    j++;
                }
            } else {
                for (let j = 1; j < this.upgrades[i].level;) {
                    ctx.beginPath();
                    ctx.moveTo(spaceFromLeft + (width / this.maxUpgradeLvl) * j, canvas.height - spaceFromBottom - max * spaceBetween - height / 2);
                    ctx.lineTo(spaceFromLeft + (width / this.maxUpgradeLvl) * j, canvas.height - spaceFromBottom - max * spaceBetween + height / 2);
                    ctx.closePath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#6e6e6e';
                    ctx.stroke();
                    j++;
                }
            }



            this.makeText(ctx, i, spaceFromLeft + width / 2, canvas.height - spaceFromBottom + 1 - max * spaceBetween, canvas.width / 160, 'white', 2)
            max += 1
        }


        this.makeText(ctx, `x${allocatable}`, spaceFromLeft + width - canvas.width / 120, canvas.height - spaceFromBottom - (max) * spaceBetween, canvas.width / 120, 'white', 4)
    }

    checkUpgradeRequest(canvas, mouse) {
        let spaceBetween = canvas.width / 85;
        let height = canvas.width / 130;
        let width = canvas.width / 7; // turn this stuff into ui properties
        let spaceFromLeft = this.upgradesPanel.spaceFromLeft;
        let spaceFromBottom = this.upgradesPanel.spaceFromBottom;
        let max = 0;
        for (let i in this.upgrades) {
            if (20 < mouse.X && mouse.X < spaceFromLeft + width && canvas.height - spaceFromBottom - max * spaceBetween - height / 2 < mouse.Y && mouse.Y < canvas.height - spaceFromBottom - max * spaceBetween + height / 2) {
                let j = Math.ceil((mouse.X - spaceFromLeft) / (width / this.maxUpgradeLvl))
                //console.log(i)
                return { 'name': i, 'levelRequesting': j }
            }
            max += 1;
        }
        return 'None'

    }
    renderMinimap(ctx, canvas, playerPos, mapSize) {
        let spaceFromBottom = 10;
        let spaceFromRight = 10;
        let size = 200;


        ctx.beginPath();
        ctx.rect(canvas.width - spaceFromRight - size, canvas.height - spaceFromBottom - size, size, size)
        ctx.closePath();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#c2c2c2';
        ctx.strokeStyle = '#7a7a7a';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.fillStyle = '#3288c2';
        ctx.arc(canvas.width - spaceFromRight - (size) * (playerPos.x / mapSize) - size / 2, canvas.height - spaceFromBottom - (size) * (playerPos.y / mapSize) - size / 2, 3, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }
    renderOther(ctx, canvas) {
        this.makeText(ctx, `${roundToDecimalPlaces(players[id].position.x, 1)}, ${roundToDecimalPlaces(players[id].position.y, 1)}`, canvas.width - 100 - 10, canvas.height - 20 - 200, 11)
    }

    renderTankUpgrades(ctx, canvas, mouse) {
        let size = canvas.width / 20;
        let spaceBetween = size / 10;
        let spaceFromLeft = size / 10;
        let spaceFromTop = (size / 10) * 4.5;
        let maxCols = 3;
        this.makeText(ctx, `Upgrade Available!`, size * 1.1, spaceFromTop - spaceFromTop / 2, (canvas.width / 190) * 2, 'white', 4)
        for (let i in this.tankUpgradeOptions) {
            ctx.beginPath()
            ctx.rect(spaceFromLeft + ((i % maxCols) * (size + spaceBetween)), spaceFromTop + (size + spaceBetween) * (Math.floor(i / maxCols)), size, size)
            ctx.closePath();
            ctx.globalAlpha = 0.8;


            if (mouse.X < spaceFromLeft + ((i % maxCols) * (size + spaceBetween)) + size && mouse.X > spaceFromLeft + ((i % maxCols) * (size + spaceBetween)) && mouse.Y > spaceFromTop + (size + spaceBetween) * (Math.floor(i / maxCols)) && mouse.Y < spaceFromTop + (size + spaceBetween) * (Math.floor(i / maxCols)) + size) {
                ctx.fillStyle = '#e0e0e0';

            } else {
                ctx.fillStyle = '#c2c2c2';
            }

            ctx.strokeStyle = '#7a7a7a';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fill();
            ctx.globalAlpha = 1;



            let entry = this.tankUpgradeOptions[i]

            entry.mockup.position.x = gameX(spaceFromLeft + ((i % maxCols) * (size + spaceBetween)) + size / 2)
            entry.mockup.position.y = gameY(spaceFromTop + (size + spaceBetween) * (Math.floor(i / maxCols)) + size / 2)
            entry.mockup.size = ((canvas.width) / 120) * GSRatio
            entry.mockup.color = "playerBlue"

            tankRenderer(entry.mockup, ctx)
            this.makeText(ctx, this.tankUpgradeOptions[i].name, spaceFromLeft + ((i % maxCols) * (size + spaceBetween)) + size / 2, spaceFromTop + (size + spaceBetween) * (Math.floor(i / maxCols)) + size - spaceBetween, canvas.width / 190, 'white', 2)


        }
    }


    checkTankUpgradeRequest(mouse) {
        let size = canvas.width / 20;
        let spaceBetween = size / 10;
        let spaceFromLeft = size / 10;
        let spaceFromTop = (size / 10);
        let maxCols = 3;
        for (let i in this.tankUpgradeOptions) {

            if (mouse.X < spaceFromLeft + ((i % maxCols) * (size + spaceBetween)) + size && mouse.X > spaceFromLeft + ((i % maxCols) * (size + spaceBetween)) && mouse.Y > spaceFromTop + (size + spaceBetween) * (Math.floor(i / maxCols)) && mouse.Y < spaceFromTop + (size + spaceBetween) * (Math.floor(i / maxCols)) + size) {

                return this.tankUpgradeOptions[i].name
            }
        }
        return 'None'
    }
}