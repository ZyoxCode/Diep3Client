const REFERENCE_SIZE = 5;

class UI {
    constructor(colorPresets) {
        this.colorPresets = colorPresets;
        this.broadcasts = [];
        this.maxBroadcastTime = 500;

        this.upgradesPanel = { 'width': 300, 'height': 20, 'spaceBetween': 30, 'spaceFromLeft': 20, 'spaceFromBottom': 50 }
        this.maxUpgradeLvl = 9;
        this.upgrades = {};
        this.tankUpgradeOptions = [];
    }
    presetToColorString(presetString) {
        let preset = this.colorPresets[presetString];
        let fillColor = preset.fill;
        let strokeColor = preset.stroke;

        return `rgb(${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]})`, ctx.fillStyle = `rgb(${fillColor[0]} ${fillColor[1]} ${fillColor[2]})`
    }
    makeCurvedBox(ctx, centerX, centerY, width, height, alpha = 0.8, color = 'gray', lineWidth = 0, startFromLeft = false) {
        ctx.lineWidth = lineWidth;

        if (color != 'gray') {
            let colors = this.presetToColorString(color)
            ctx.fillStyle = colors[0]

        } else {
            ctx.fillStyle = color;

        }

        ctx.strokeStyle = 'gray';

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
    makeText(ctx, text, centerX, centerY, size, color = 'white', strokeWidth = 3, opacity = 1, strokeColor = 'gray') {

        ctx.globalAlpha = opacity;
        ctx.font = `bold ${size}px Ubuntu`
        ctx.fillStyle = color;
        ctx.strokeStyle = strokeColor;
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


        if (leaderboard.entries.length > 0) {
            maxScore = leaderboard.entries[0].score
        }

        this.makeText(ctx, 'Leaderboard', canvas.width - width / 2 - offsetFromRight, offsetFromTop - 25, 20)
        for (let i in leaderboard.entries) {

            let entry = leaderboard.entries[i]


            this.makeCurvedBox(ctx, canvas.width - width / 2 - offsetFromRight, offsetFromTop + i * spaceBetween, width, height, 1, 'barrelGrey', 5);
            let color = 'playerRed'
            if (entry.id == playerId) {
                color = 'playerBlue'
            }
            this.makeCurvedBox(ctx, canvas.width - width - offsetFromRight, offsetFromTop + i * spaceBetween, (width - 10) * (entry.score / maxScore) + 10, height, 1, color, 0, true);

            let displayText = entry.score
            if (parseInt(entry.score) >= 1000) {
                displayText = `${parseInt(entry.score) / 1000}k`
            }

            this.makeText(ctx, `${entry.name} - ${entry.tank}: ${displayText}`, canvas.width - width / 2 - offsetFromRight, offsetFromTop + 1 + i * spaceBetween, fontSize, 'white', fontSize / 5, 1, '#575757')
            // let renderList = [];
            // entry.mockup.position.x = gameX(canvas.width - width - offsetFromRight - 20)
            // entry.mockup.position.y = gameY(offsetFromTop + i * spaceBetween)
            // entry.mockup.color = color
            // positionRecursor(renderList, entry.mockup, { 'x': 0, 'y': 0 }, -45 * (Math.PI / 180), true, 1, entry.mockup.size / REFERENCE_SIZE)
            // renderList.sort((b, a) => b.position - a.position);

            // ctx.lineWidth = (1 / 5) / GSRatio;
            // for (let object of renderList) {
            //     renderShape(object.shape, object.offset, object.rotation, object.color, object.sizeMultiplier, 0, 20)
            // }
        }
    }
    renderScoreBar(ctx, canvas, playerScore) {
        this.makeCurvedBox(ctx, canvas.width / 2, canvas.height - 50, 400, 28, 1, 'squareYellow', 4);
        this.makeText(ctx, `Score: ${playerScore}`, canvas.width / 2, canvas.height - 49, 20, 'white', 4, 1)
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

            this.makeCurvedBox(ctx, canvas.width / 2, 20 - cumulativeYShift + spaceBetween * i, 400, 25, defaultOpacity * broadcast.opacity, 'gray', 0);
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

    renderSkillUpgrades(ctx, canvas, mouse, allocatable) {

        let spaceBetween = this.upgradesPanel.spaceBetween;
        let height = this.upgradesPanel.height;
        let width = this.upgradesPanel.width; // turn this stuff into ui properties
        let spaceFromLeft = this.upgradesPanel.spaceFromLeft;
        let spaceFromBottom = this.upgradesPanel.spaceFromBottom;
        let max = 0;

        for (let i in this.upgrades) {

            this.makeCurvedBox(ctx, spaceFromLeft + width / 2, canvas.height - spaceFromBottom - max * spaceBetween, width, height, 0.8, 'gray', 3)

            if (spaceFromLeft < mouse.X && mouse.X < spaceFromLeft + width && canvas.height - spaceFromBottom - max * spaceBetween - height / 2 < mouse.Y && mouse.Y < canvas.height - spaceFromBottom - max * spaceBetween + height / 2) {
                let j = Math.ceil((mouse.X - 20) / (width / this.maxUpgradeLvl))
                this.makeCurvedBox(ctx, spaceFromLeft, canvas.height - spaceFromBottom - max * spaceBetween, (width / this.maxUpgradeLvl) * j, height, 0.8, 'whiteHighlight', 0, true)
            }
            this.makeCurvedBox(ctx, spaceFromLeft, canvas.height - spaceFromBottom - max * spaceBetween, (width / this.maxUpgradeLvl) * this.upgrades[i].level, height, 0.8, this.upgrades[i].color, 0, true)


            for (let j = 1; j < this.maxUpgradeLvl;) {
                ctx.beginPath();
                ctx.moveTo(spaceFromLeft + (width / this.maxUpgradeLvl) * j, canvas.height - spaceFromBottom - max * spaceBetween - height / 2);
                ctx.lineTo(spaceFromLeft + (width / this.maxUpgradeLvl) * j, canvas.height - spaceFromBottom - max * spaceBetween + height / 2);
                ctx.closePath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#6e6e6e';
                ctx.stroke();
                j++;
            }


            this.makeText(ctx, i, spaceFromLeft + width / 2, canvas.height - spaceFromBottom + 1 - max * spaceBetween, 15, 'white', 2)
            max += 1
        }


        this.makeText(ctx, `Allocatable: ${allocatable}`, spaceFromLeft + width / 2, canvas.height - spaceFromBottom + 1 - (max) * spaceBetween, 17, 'white', 4)
    }

    checkUpgradeRequest(canvas, mouse) {
        let spaceBetween = this.upgradesPanel.spaceBetween;
        let height = this.upgradesPanel.height;
        let width = this.upgradesPanel.width; // turn this stuff into ui properties
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

    renderTankUpgrades(ctx, canvas, mouse) {
        let size = 100;
        let spaceBetween = 10;
        let spaceFromLeft = 10;
        let spaceFromTop = 45;
        this.makeText(ctx, `Upgrade Available!`, 110, spaceFromTop - 18, 20, 'white', 4)
        for (let i in this.tankUpgradeOptions) {
            ctx.beginPath()
            ctx.rect(spaceFromLeft + i * (size + spaceBetween), spaceFromTop, size, size)
            ctx.closePath();
            ctx.globalAlpha = 0.8;
            // if (i == 0) {
            //     console.log(mouse.X < spaceFromLeft + i * (size + spaceBetween) + size &&)
            // }

            if (mouse.X < spaceFromLeft + i * (size + spaceBetween) + size && mouse.X > spaceFromLeft + i * (size + spaceBetween) && mouse.Y > spaceFromTop && mouse.Y < spaceFromTop + size) {
                ctx.fillStyle = '#e0e0e0';

            } else {
                ctx.fillStyle = '#c2c2c2';
            }

            ctx.strokeStyle = '#7a7a7a';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fill();
            ctx.globalAlpha = 1;

            this.makeText(ctx, this.tankUpgradeOptions[i].name, spaceFromLeft + i * (size + spaceBetween) + size / 2, spaceFromTop + size - 10, 12, 'white', 2)

            // let entry = this.tankUpgradeOptions[i]
            // let renderList = [];
            // entry.mockup.position.x = gameX(spaceFromLeft + i * (size + spaceBetween) + size / 2)
            // entry.mockup.position.y = gameY(spaceFromTop + size / 2)
            // entry.mockup.size = 2
            // positionRecursor(renderList, entry.mockup, { 'x': 0, 'y': 0 }, -45 * (Math.PI / 180), true, 1, entry.mockup.size / REFERENCE_SIZE)
            // renderList.sort((b, a) => b.position - a.position);

            // ctx.lineWidth = (2 / 5) / GSRatio;
            // for (let object of renderList) {
            //     renderShape(object.shape, object.offset, object.rotation, object.color, object.sizeMultiplier, 0, 20)
            // }
        }
    }

    checkTankUpgradeRequest(mouse) {
        let size = 100;
        let spaceBetween = 10;
        let spaceFromLeft = 10;
        let spaceFromTop = 10;
        for (let i in this.tankUpgradeOptions) {

            if (mouse.X < spaceFromLeft + i * (size + spaceBetween) + size && mouse.X > spaceFromLeft + i * (size + spaceBetween) && mouse.Y > spaceFromTop && mouse.Y < spaceFromTop + size) {

                return this.tankUpgradeOptions[i].name
            }
        }
        return 'None'
    }
}