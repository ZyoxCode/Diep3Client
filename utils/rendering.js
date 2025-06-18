let tankRenders;
fetch('../client/resources/tankRenders.json')
    .then(response => response.json())
    .then(data => {
        tankRenders = data;
    });

class Joint {
    constructor(info) {
        this.distanceFromLast = info.distanceFromLast;
        this.angleFromLast = info.angleFromLast
        this.rotationBehaviour = info.rotationBehaviour
        this.perpendicularDistance = info.perpendicularDistance;
        this.animationBehaviour = info.animationBehaviour
        this.distanceToNextMultiplier = info.distanceToNextMultiplier;


        this.childJoints = [];
        for (let joint of info.childJoints) {
            this.childJoints.push(new Joint(joint))
        }
    }
    propagate(path, lastCenter, lastRotation, sizeMultiplier, distanceToNextMultiplier = 1) {
        path.splice(0, 1);

        console.log(sizeMultiplier, this.distanceFromLast * sizeMultiplier * distanceToNextMultiplier)
        let nV = {
            'x': lastCenter.x + this.perpendicularDistance * sizeMultiplier, 'y': lastCenter.y + this.distanceFromLast * sizeMultiplier * distanceToNextMultiplier
        }




        let newRotation;
        if (this.rotationBehaviour == 'inherets') {
            newRotation = this.angleFromLast + lastRotation;
        } else {
            newRotation = this.angleFromLast;
        }
        let rV = rotateVertice2(nV, lastCenter, newRotation);
        //console.log(rV)

        if (path.length == 0) {
            return [rV, newRotation];
        } else {
            return this.childJoints[path[0]].propagate(path, rV, newRotation, sizeMultiplier, this.distanceToNextMultiplier)
        }
    }
}

function screenX(currentX) {
    return (playerX - currentX) / GSRatio + (canvas.width / 2)
}

function gameX(screenX) {
    return playerX - (screenX - (canvas.width / 2)) * GSRatio
}

function screenY(currentY) {
    return (playerY - currentY) / GSRatio + (canvas.height / 2)
}

function gameY(screenY) {
    return playerY - (screenY - (canvas.height / 2)) * GSRatio
}

function verticeRelation(curPlayer, offset, rotation, vertice) {

    return rotateVertice([vertice[0] + offset[0] + curPlayer.position.x, vertice[1] + offset[1] + curPlayer.position.y], [curPlayer.position.x, curPlayer.position.y], curPlayer.rotation + rotation * (Math.PI / 180))

}

function rotateVertice(vertice, pivot, angle) {
    let x = Math.cos(angle) * (vertice[0] - pivot[0]) + Math.sin(angle) * (vertice[1] - pivot[1])
    let y = -Math.sin(angle) * (vertice[0] - pivot[0]) + Math.cos(angle) * (vertice[1] - pivot[1])
    return [x, y]
}

function rotateVertice2(vertice, pivot, angle) {
    let x = Math.cos(angle) * (vertice.x - pivot.x) + Math.sin(angle) * (vertice.y - pivot.y) + pivot.x
    let y = -Math.sin(angle) * (vertice.x - pivot.x) + Math.cos(angle) * (vertice.y - pivot.y) + pivot.y
    return { 'x': x, 'y': y }
}

function renderShape(shape, gamePosition, rotate, color, sizeMultiplier, flashTimer, fadeTimer) {

    ctx.globalAlpha = fadeTimer / 20;

    let fillColor = getFlashColor(colorList[color].fill, flashTimer * FLASH_LAMBDA)
    let strokeColor = getFlashColor(colorList[color].stroke, flashTimer * FLASH_LAMBDA)

    ctx.fillStyle = `rgb(${fillColor[0]} ${fillColor[1]} ${fillColor[2]})`;
    ctx.strokeStyle = `rgb(${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]})`;


    ctx.beginPath();
    //console.log(shape, gamePosition)
    if (shape.type == 'circle') {

        ctx.beginPath();
        //console.log(gamePosition)
        //console.log(gamePosition, shape.size, sizeMultiplier.y)
        ctx.arc(screenX(gamePosition.x), screenY(gamePosition.y), (shape.size * sizeMultiplier.y) / GSRatio, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

    } else {
        for (let j in shape.vertices) {

            let vertice = shape.vertices[j];

            let transformedVertice = rotateVertice([vertice.x * sizeMultiplier.x, vertice.y * sizeMultiplier.y], [0, 0], shape.rotation + rotate)

            if (j == 0) {
                ctx.moveTo(screenX(gamePosition.x + transformedVertice[0]), screenY(gamePosition.y + transformedVertice[1]));
            } else {
                ctx.lineTo(screenX(gamePosition.x + transformedVertice[0]), screenY(gamePosition.y + transformedVertice[1]));
            }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }
}

function positionRecursor(renderList, object, offset, rotation, topLevel = false, level = 1, sizeMultiplier = 1) {

    // On top level we are relative to 0, 0

    if (topLevel) {
        let newSizeMultiplier = sizeMultiplier
        let offset2 = { "x": object.position.x, "y": object.position.y }

        //console.log(`Level ${level} Object Position:`, object.position, "Rotations:", rotation, object.rotation)

        for (let shape of object.shapes) {
            renderList.push({ 'shape': shape, 'offset': offset2, 'rotation': object.rotation, 'position': 0, 'color': object.color, 'sizeMultiplier': { 'x': sizeMultiplier, 'y': sizeMultiplier } })
            //renderShape(shape, offset2, object.rotation)
        }
        if (object.attachedObjects.length > 0) {
            for (let subObject of object.attachedObjects) {
                positionRecursor(renderList, subObject, offset2, object.rotation + rotation, false, level + 1, newSizeMultiplier)
            }

        }
    } else {
        //console.log(object)
        let animationOffsets = {}
        if (object.hasAnimationTimer && object.animationTimer != 0) {

            let objectAnimation = new Animator('standardRecoil', object.maxAnimationTimer)
            animationOffsets = objectAnimation.getCurrentKeyFrame(object.animationTimer)

        } else {
            animationOffsets = { 'sizeMultipliers': { 'x': 1, 'y': 1 }, 'positionOffset': { 'x': 0, 'y': 0 }, 'rotationOffset': 0 }
        }
        rV = rotateVertice([object.position.x * sizeMultiplier + offset.x, object.position.y * sizeMultiplier + offset.y], [offset.x, offset.y], rotation + object.rotation + animationOffsets.rotationOffset)
        //console.log(rV)
        let offset2 = { "x": offset.x + rV[0], "y": offset.y + rV[1] }
        //console.log(`Level ${level} Object Position:`, object.position, "Rotations:", rotation, object.facingRotation, object.rotation)
        //console.log(rotation, object.facingRotation, object.rotation)
        for (let shape of object.shapes) {
            let zPos = 0;

            if (object.renderBeforePlayer) {
                zPos = -1;
            } else {
                zPos = 1;
            }

            renderList.push({ 'shape': shape, 'offset': offset2, 'rotation': object.rotation + rotation + object.facingRotation + animationOffsets.rotationOffset, 'position': zPos, 'color': object.color, 'sizeMultiplier': { 'x': sizeMultiplier * animationOffsets.sizeMultipliers.x, 'y': sizeMultiplier * animationOffsets.sizeMultipliers.y } })
            // renderShape(shape, offset2, object.rotation + rotation + object.facingRotation)
        }

        if (object.attachedObjects.length > 0) {
            for (let subObject of object.attachedObjects) {
                positionRecursor(renderList, subObject, offset2, object.rotation + rotation + animationOffsets.rotationOffset, false, level + 1, sizeMultiplier)
            }

        }

    }
}

function renderWireFrameCircle(position, size, ctx, color = 'grey') {
    ctx.fillStyle = color
    ctx.beginPath();
    ctx.arc(screenX(position.x), screenY(position.y), size, 0, Math.PI * 2)
    ctx.fill();
    ctx.closePath();
}

function tankRenderer(object, ctx) {
    ctx.globalAlpha = object.fadeTimer / 20;
    ctx.lineWidth = 0.6 / GSRatio;
    //console.log(tankRenders[object.tankType])


    let sizeMultiplier = object.size / object.attachmentReferenceSize;



    let joints = [];
    for (let joint of object.attachedObjects) {
        joints.push(new Joint(joint))
    }

    for (let render of tankRenders[object.tankType]) {
        //console.log(render.path)
        let path = [...render.path];

        //asconsole.log(path)
        let pointData = joints[path[0]].propagate(path, object.position, object.rotation, sizeMultiplier)
        let point = pointData[0]
        let rotation = pointData[1]



        for (let shape of render.baseShapes) {
            if (shape.type == 'rect') {

                ctx.beginPath();
                let fillPreset = colorList['barrelGrey'].fill
                ctx.fillStyle = `rgb(${fillPreset[0]}, ${fillPreset[1]}, ${fillPreset[2]})`

                let strokePreset = colorList['barrelGrey'].stroke
                ctx.strokeStyle = `rgb(${strokePreset[0]}, ${strokePreset[1]}, ${strokePreset[2]})`



                let rV = rotateVertice([(shape.size.x / 2 + shape.offset.x) * sizeMultiplier, shape.offset.y * sizeMultiplier], [0, 0], rotation)
                rV[0] = rV[0] + point.x;
                rV[1] = rV[1] + point.y;

                ctx.moveTo(screenX(rV[0]), screenY(rV[1]))
                // rV = { 'x': rV[0], 'y': rV[1] }
                // renderWireFrameCircle(rV, 2, ctx, 'black')

                rV = rotateVertice([(-shape.size.x / 2 + shape.offset.x) * sizeMultiplier, shape.offset.y * sizeMultiplier], [0, 0], rotation)
                rV[0] = rV[0] + point.x;
                rV[1] = rV[1] + point.y;

                ctx.lineTo(screenX(rV[0]), screenY(rV[1]))
                // rV = { 'x': rV[0], 'y': rV[1] }

                // renderWireFrameCircle(rV, 2, ctx, 'black')

                rV = rotateVertice([(-shape.size.x / 2 + shape.offset.x) * sizeMultiplier, (shape.size.y + shape.offset.y) * sizeMultiplier], [0, 0], rotation)
                rV[0] = rV[0] + point.x;
                rV[1] = rV[1] + point.y;
                // rV = { 'x': rV[0], 'y': rV[1] }

                ctx.lineTo(screenX(rV[0]), screenY(rV[1]))

                // renderWireFrameCircle(rV, 2, ctx, 'black')

                rV = rotateVertice([(shape.size.x / 2 + shape.offset.x) * sizeMultiplier, (shape.size.y + shape.offset.y) * sizeMultiplier], [0, 0], rotation)
                rV[0] = rV[0] + point.x;
                rV[1] = rV[1] + point.y;

                ctx.lineTo(screenX(rV[0]), screenY(rV[1]))

                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // rV = { 'x': rV[0], 'y': rV[1] }

                // renderWireFrameCircle(rV, 2, ctx, 'black')

            }
            renderWireFrameCircle(point, 2, ctx, 'black')

            //console.log(shape)
        }

        point = object.position;
        fillPreset = getFlashColor(colorList[object.color].fill, FLASH_LAMBDA * object.flashTimer)

        ctx.fillStyle = `rgb(${fillPreset[0]}, ${fillPreset[1]}, ${fillPreset[2]})`

        strokePreset = getFlashColor(colorList[object.color].stroke, FLASH_LAMBDA * object.flashTimer)

        ctx.strokeStyle = `rgb(${strokePreset[0]}, ${strokePreset[1]}, ${strokePreset[2]})`

        ctx.beginPath();
        ctx.arc(screenX(point.x), screenY(point.y), object.size / GSRatio, 0, Math.PI * 2)
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    //console.log(object)


    // point = joints[0].propagate([0], object.position, object.rotation, sizeMultiplier)[0]
    // console.log(point)
    // ctx.beginPath();
    // ctx.arc(screenX(point.x), screenY(point.y), 2, 0, Math.PI * 2)
    // ctx.stroke();
    // ctx.closePath();


    // if (topLevel == true) {
    //     renderList.push({ 'shape': { 'type': 'circle', 'size': object.size }, 'offset': { 'x': object.position.x, 'y': object.position.y }, 'size': 5, 'color': 'playerBlue', 'rotation': object.rotation, 'position': 0, 'sizeMultiplier': { 'x': 1, 'y': 1 } })
    //     for (let subObject of object.attachedObjects) {

    //         positionRecursor2(renderList, subObject, { 'x': object.position.x, 'y': object.position.y }, object.rotation, false, level + 1, 1)
    //     }
    // } else {
    //     rV = rotateVertice([object.perpendicularDistance + offset.x, object.distanceFromLast * sizeMultiplier + offset.y], [offset.x, offset.y], rotation + object.angleFromLast)
    //     renderList.push({ 'shape': { 'type': 'circle', 'size': 2 }, 'offset': { 'x': rV[0] + offset.x, 'y': rV[1] + offset.y }, 'size': 5, 'color': 'barrelGrey', 'rotation': rotation + object.angleFromLast, 'position': 0, 'sizeMultiplier': { 'x': 1, 'y': 1 } })

    //     for (let subObject of object.childJoints) {
    //         positionRecursor2(renderList, subObject, { 'x': rV[0] + offset.x, 'y': rV[1] + offset.y }, object.rotation, false, level + 1, 1)
    //     }
    // }
}
