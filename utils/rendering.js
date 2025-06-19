let tankRenders;
fetch('../resources/tankrenders.json')
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

        this.animationValues = []
        if ('animationValues' in info) {
            this.animationValues = info.animationValues
        }



        this.childJoints = [];
        for (let joint of info.childJoints) {
            this.childJoints.push(new Joint(joint))
        }
    }
    propagate(path, lastCenter, lastRotation, sizeMultiplier, distanceToNextMultiplier = 1) {
        path.splice(0, 1);

        //console.log(sizeMultiplier, this.distanceFromLast * sizeMultiplier * distanceToNextMultiplier)
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
            return [rV, newRotation, this.animationValues];
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

    if (shape.type == 'circle') {

        ctx.beginPath();

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



        for (let shape of object.shapes) {
            renderList.push({ 'shape': shape, 'offset': offset2, 'rotation': object.rotation, 'position': 0, 'color': object.color, 'sizeMultiplier': { 'x': sizeMultiplier, 'y': sizeMultiplier } })

        }
        if (object.attachedObjects.length > 0) {
            for (let subObject of object.attachedObjects) {
                positionRecursor(renderList, subObject, offset2, object.rotation + rotation, false, level + 1, newSizeMultiplier)
            }

        }
    } else {

        let animationOffsets = {}
        if (object.hasAnimationTimer && object.animationTimer != 0) {

            let objectAnimation = new Animator('standardRecoil', object.maxAnimationTimer)
            animationOffsets = objectAnimation.getCurrentKeyFrame(object.animationTimer)

        } else {
            animationOffsets = { 'sizeMultipliers': { 'x': 1, 'y': 1 }, 'positionOffset': { 'x': 0, 'y': 0 }, 'rotationOffset': 0 }
        }
        rV = rotateVertice([object.position.x * sizeMultiplier + offset.x, object.position.y * sizeMultiplier + offset.y], [offset.x, offset.y], rotation + object.rotation + animationOffsets.rotationOffset)

        let offset2 = { "x": offset.x + rV[0], "y": offset.y + rV[1] }

        for (let shape of object.shapes) {
            let zPos = 0;

            if (object.renderBeforePlayer) {
                zPos = -1;
            } else {
                zPos = 1;
            }

            renderList.push({ 'shape': shape, 'offset': offset2, 'rotation': object.rotation + rotation + object.facingRotation + animationOffsets.rotationOffset, 'position': zPos, 'color': object.color, 'sizeMultiplier': { 'x': sizeMultiplier * animationOffsets.sizeMultipliers.x, 'y': sizeMultiplier * animationOffsets.sizeMultipliers.y } })

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


function renderer(shape, ctx) {
    ctx.fillStyle = `rgb(${shape.colors.fill[0]}, ${shape.colors.fill[1]}, ${shape.colors.fill[2]})`
    ctx.strokeStyle = `rgb(${shape.colors.stroke[0]}, ${shape.colors.stroke[1]}, ${shape.colors.stroke[2]})`

    ctx.beginPath();
    if (shape.type == 'rect') {

        let rV = rotateVertice([(shape.dimensions.x / 2 + shape.offset.x) * shape.multipliers.x * shape.multipliers.global, shape.offset.y * shape.multipliers.y * shape.multipliers.global], [0, 0], shape.rotation)
        rV[0] = rV[0] + shape.center.x;
        rV[1] = rV[1] + shape.center.y;
        ctx.moveTo(screenX(rV[0]), screenY(rV[1]))

        rV = rotateVertice([(-shape.dimensions.x / 2 + shape.offset.x) * shape.multipliers.x * shape.multipliers.global, shape.offset.y * shape.multipliers.y * shape.multipliers.global], [0, 0], shape.rotation)
        rV[0] = rV[0] + shape.center.x;
        rV[1] = rV[1] + shape.center.y;
        ctx.lineTo(screenX(rV[0]), screenY(rV[1]))


        rV = rotateVertice([(-shape.dimensions.x / 2 + shape.offset.x) * shape.multipliers.x * shape.multipliers.global * shape.aspect, (shape.dimensions.y + shape.offset.y) * shape.multipliers.y * shape.multipliers.global], [0, 0], shape.rotation)
        rV[0] = rV[0] + shape.center.x;
        rV[1] = rV[1] + shape.center.y;
        ctx.lineTo(screenX(rV[0]), screenY(rV[1]))


        rV = rotateVertice([(shape.dimensions.x / 2 + shape.offset.x) * shape.multipliers.x * shape.multipliers.global * shape.aspect, (shape.dimensions.y + shape.offset.y) * shape.multipliers.y * shape.multipliers.global], [0, 0], shape.rotation)
        rV[0] = rV[0] + shape.center.x;
        rV[1] = rV[1] + shape.center.y;
        ctx.lineTo(screenX(rV[0]), screenY(rV[1]))


    } else if (shape.type == 'circle') {
        ctx.arc(screenX(shape.center.x), screenY(shape.center.y), shape.dimensions / GSRatio, 0, Math.PI * 2)
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();


}

function tankRenderer(object, ctx) {
    ctx.globalAlpha = object.fadeTimer / 20;
    ctx.lineWidth = 0.5 / GSRatio;



    let sizeMultiplier = (object.size / object.attachmentReferenceSize) + (20 - object.fadeTimer) * 0.04



    let joints = [];
    for (let joint of object.attachedObjects) {
        joints.push(new Joint(joint))
    }

    let renderList = [] // Player will be z-index 0

    for (let render of tankRenders[object.tankType]) {

        let path = [...render.path];
        let animationBindings = [...render.animationBindings]


        let pointData = joints[path[0]].propagate(path, object.position, object.rotation, sizeMultiplier)
        let point = pointData[0];
        let rotation = pointData[1];
        let animationValues = pointData[2];


        let yScaleMultiplier = 1
        console.log(render.path, point, rotation)

        for (let animation of animationBindings) {
            if (animation.binding == 'yscale') {
                yScaleMultiplier = animationValues[animation.index]
            }
        }

        for (let shape of render.baseShapes) {
            let newYScaleMultiplier = yScaleMultiplier

            if ('animationOverride' in shape) {
                if (shape.animationOverride == true) {
                    newYScaleMultiplier = 1;
                }

            }

            if (shape.type == 'rect') {
                let zIndex = -1;
                if ('z-index' in shape) {
                    zIndex = shape['z-index'];
                }
                let aspect = 1;
                if ('aspect' in shape) {
                    aspect = shape['aspect'];
                }
                ctx.beginPath();
                let fillPreset = colorList['barrelGrey'].fill
                let strokePreset = colorList['barrelGrey'].stroke
                console.log(render.path, { 'z-index': zIndex, 'type': shape.type, 'dimensions': shape.size, 'offset': shape.offset, 'rotation': rotation, 'center': point, 'multipliers': { 'global': sizeMultiplier, 'x': 1, 'y': newYScaleMultiplier }, 'aspect': aspect, 'colors': { 'fill': fillPreset, 'stroke': strokePreset } })
                renderList.push({ 'z-index': zIndex, 'type': shape.type, 'dimensions': shape.size, 'offset': shape.offset, 'rotation': rotation, 'center': point, 'multipliers': { 'global': sizeMultiplier, 'x': 1, 'y': newYScaleMultiplier }, 'aspect': aspect, 'colors': { 'fill': fillPreset, 'stroke': strokePreset } })

            } else if (shape.type == 'circle') {
                let zIndex = -1;
                if ('z-index' in shape) {
                    zIndex = shape['z-index'];
                }
                let aspect = 1;
                if ('aspect' in shape) {
                    aspect = shape['aspect'];
                }
                ctx.beginPath();
                let fillPreset = colorList['barrelGrey'].fill
                let strokePreset = colorList['barrelGrey'].stroke

                renderList.push({ 'z-index': zIndex, 'type': shape.type, 'dimensions': shape.size, 'offset': shape.offset, 'rotation': rotation, 'center': point, 'multipliers': { 'global': sizeMultiplier, 'x': 1, 'y': newYScaleMultiplier }, 'aspect': aspect, 'colors': { 'fill': fillPreset, 'stroke': strokePreset } })
            }

        }

        point = object.position;
        let color = object.color
        if (object.color == 'playerBlue' && object.id != id) {
            color = 'playerRed'
        }
        let fillPreset = getFlashColor(colorList[color].fill, FLASH_LAMBDA * object.flashTimer)
        let strokePreset = getFlashColor(colorList[color].stroke, FLASH_LAMBDA * object.flashTimer)

        renderList.push({ 'z-index': 0, 'type': 'circle', 'dimensions': object.size * (1 + (20 - object.fadeTimer) * 0.04), 'center': point, 'colors': { 'fill': fillPreset, 'stroke': strokePreset } })
        renderList.sort((b, a) => b['z-index'] - a['z-index']);

        for (let renderObject of renderList) {
            renderer(renderObject, ctx);
        }
    }
}
