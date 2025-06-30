let tankRenders;
fetch('../resources/tankrenders.json')
    .then(response => response.json())
    .then(data => {
        tankRenders = data;
    });

let polyRenders;
fetch('../resources/polyrenders.json')
    .then(response => response.json())
    .then(data => {
        polyRenders = data;
    });

let projRenders;
fetch('../resources/projrenders.json')
    .then(response => response.json())
    .then(data => {
        projRenders = data;
    });

const ATTACHMENT_REFERENCE_SIZE = 5;
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
        //console.log(path, lastCenter, lastRotation, sizeMultiplier)
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
        ctx.lineWidth = 0.5 / GSRatio
        ctx.arc(screenX(shape.center.x), screenY(shape.center.y), (shape.dimensions * shape.multipliers.global) / GSRatio, 0, Math.PI * 2)
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();


}

function tankRenderer(object, ctx) {
    ctx.globalAlpha = object.fadeTimer / 20;
    ctx.lineWidth = 0.5 / GSRatio;



    let sizeMultiplier = (object.size / ATTACHMENT_REFERENCE_SIZE) + (20 - object.fadeTimer) * 0.04



    let joints = [];
    for (let joint of object.joints) {
        joints.push(new Joint(joint))
    }

    let renderList = [] // Player will be z-index 0

    for (let render of tankRenders[object.tankoidPreset]) {

        let path = [...render.path];
        let animationBindings = [...render.animationBindings]


        let pointData = joints[path[0]].propagate(path, object.position, object.rotation, sizeMultiplier)
        //console.log(pointData)
        let point = pointData[0];
        let rotation = pointData[1];
        let animationValues = pointData[2];


        let yScaleMultiplier = 1
        //console.log(render.path, point, rotation)

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
                //console.log(render.path, { 'z-index': zIndex, 'type': shape.type, 'dimensions': shape.size, 'offset': shape.offset, 'rotation': rotation, 'center': point, 'multipliers': { 'global': sizeMultiplier, 'x': 1, 'y': newYScaleMultiplier }, 'aspect': aspect, 'colors': { 'fill': fillPreset, 'stroke': strokePreset } })
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
        let color = "playerBlue"; // Temp
        if (!(object.color == 'barrelGrey') && object.id != id) {
            color = 'playerRed';
        }
        let fillPreset = getFlashColor(colorList[color].fill, FLASH_LAMBDA * object.flashTimer)
        let strokePreset = getFlashColor(colorList[color].stroke, FLASH_LAMBDA * object.flashTimer)

        renderList.push({ 'z-index': 0, 'type': 'circle', 'dimensions': object.size * (1 + (20 - object.fadeTimer) * 0.04), 'center': point, 'colors': { 'fill': fillPreset, 'stroke': strokePreset }, 'multipliers': { 'global': 1, 'x': 1, 'y': 1 } })
        renderList.sort((b, a) => b['z-index'] - a['z-index']);

        for (let renderObject of renderList) {
            renderer(renderObject, ctx);
        }
    }
}


function polygonRenderer(poly, ctx) {
    //let renderList = [];
    //console.log(poly)
    ctx.globalAlpha = poly.fadeTimer / 20;
    if (poly.sides == 0) {
        for (let shape of polyRenders[poly.polygonType]) {
            let fillPreset = getFlashColor(colorList[shape.color].fill, FLASH_LAMBDA * poly.flashTimer)
            let strokePreset = getFlashColor(colorList[shape.color].stroke, FLASH_LAMBDA * poly.flashTimer)

            ctx.fillStyle = `rgb(${fillPreset[0]}, ${fillPreset[1]}, ${fillPreset[2]})`
            ctx.strokeStyle = `rgb(${strokePreset[0]}, ${strokePreset[1]}, ${strokePreset[2]})`
            //console.log(shape)
            ctx.beginPath();
            ctx.arc(screenX(poly.position.x), screenY(poly.position.y), poly.size * shape.sizeMultiplier * (1 + (20 - poly.fadeTimer) * 0.04), 0, 2 * Math.PI);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }
    } else {
        for (let shape of polyRenders[poly.polygonType]) {
            let fillPreset = getFlashColor(colorList[shape.color].fill, FLASH_LAMBDA * poly.flashTimer)
            let strokePreset = getFlashColor(colorList[shape.color].stroke, FLASH_LAMBDA * poly.flashTimer)

            ctx.fillStyle = `rgb(${fillPreset[0]}, ${fillPreset[1]}, ${fillPreset[2]})`
            ctx.strokeStyle = `rgb(${strokePreset[0]}, ${strokePreset[1]}, ${strokePreset[2]})`
            //console.log(shape)
            ctx.beginPath();
            for (let i = 0; i < poly.sides; i++) {
                //console.log(i)

                let rV = rotateVertice([0, poly.size * shape.sizeMultiplier * (1 + (20 - poly.fadeTimer) * 0.04)], [0, 0], shape.angle * (Math.PI / 180) + ((Math.PI * 2) / poly.sides) * i + poly.rotation)
                if (i == 0) {
                    ctx.moveTo(screenX(rV[0] + poly.position.x), screenY(rV[1] + poly.position.y))
                } else {
                    ctx.lineTo(screenX(rV[0] + poly.position.x), screenY(rV[1] + poly.position.y))
                }

            }
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }
    }

    ctx.globalAlpha = 1;

}

function projectileRender(proj, ctx) {
    //console.log(proj)

    ctx.globalAlpha = proj.fadeTimer / 20;
    let preset = projRenders[proj.tankoidPreset]
    let renderList = []
    for (let shape of preset.shapes) {
        let color;
        if (shape.color != 'barrelGrey') {

            if (proj.id != id) {
                color = 'playerRed';
            } else {
                color = 'playerBlue';
            }
        } else {
            color = 'barrelGrey';
        }
        let fillPreset = getFlashColor(colorList[color].fill, FLASH_LAMBDA * proj.flashTimer)
        let strokePreset = getFlashColor(colorList[color].stroke, FLASH_LAMBDA * proj.flashTimer)

        ctx.fillStyle = `rgb(${fillPreset[0]}, ${fillPreset[1]}, ${fillPreset[2]})`
        ctx.strokeStyle = `rgb(${strokePreset[0]}, ${strokePreset[1]}, ${strokePreset[2]})`

        ctx.beginPath();
        if (shape.type == 'circle') {

            let zIndex = 0;
            if ('z-index' in shape) {
                zIndex = shape['z-index'];
            }
            let aspect = 1;
            if ('aspect' in shape) {
                aspect = shape['aspect'];
            }

            renderList.push({ 'z-index': zIndex, 'type': shape.type, 'dimensions': proj.size, 'rotation': 0, 'center': proj.position, 'multipliers': { 'global': shape.sizeMultiplier * (1 + (20 - proj.fadeTimer) * 0.04), 'x': 1, 'y': 1 }, 'aspect': aspect, 'colors': { 'fill': fillPreset, 'stroke': strokePreset } })
            //ctx.arc(screenX(proj.position.x), screenY(proj.position.y), (proj.size * shape.sizeMultiplier * (1 + (20 - proj.fadeTimer) * 0.04)) / GSRatio, 0, 2 * Math.PI);


        } else if (shape.type == 'concave') {


            for (let i = 0; i < shape.sides; i++) {

                let rV = rotateVertice([0, proj.size * shape.sizeMultiplier * (1 + (20 - proj.fadeTimer) * 0.04)], [0, 0], shape.angle * (Math.PI / 180) + ((Math.PI * 2) / shape.sides) * i + proj.rotation)
                if (i == 0) {
                    ctx.moveTo(screenX(rV[0] + proj.position.x), screenY(rV[1] + proj.position.y))
                } else {
                    ctx.lineTo(screenX(rV[0] + proj.position.x), screenY(rV[1] + proj.position.y))
                }

                rV = rotateVertice([0, proj.size * shape.sizeMultiplier * shape.outerMultiplier * (1 + (20 - proj.fadeTimer) * 0.04)], [0, 0], shape.angle * (Math.PI / 180) + ((Math.PI * 2) / shape.sides) * (i + 1 / 2) + proj.rotation)

                ctx.lineTo(screenX(rV[0] + proj.position.x), screenY(rV[1] + proj.position.y))

            }
        }

        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }

    if (preset.renderType == "jointed") {
        ctx.globalAlpha = proj.fadeTimer / 20;
        ctx.lineWidth = 0.5 / GSRatio;



        let sizeMultiplier = (proj.size / ATTACHMENT_REFERENCE_SIZE) * (1 + (20 - proj.fadeTimer) * 0.04)
        //console.log(sizeMultiplier)



        let joints = [];
        for (let joint of proj.joints) {
            joints.push(new Joint(joint))
        }

        // Player will be z-index 0

        for (let render of preset.renders) {

            let path = [...render.path];
            let animationBindings = [...render.animationBindings]


            let pointData = joints[path[0]].propagate(path, proj.position, proj.rotation, sizeMultiplier)
            let point = pointData[0];
            let rotation = pointData[1];
            let animationValues = pointData[2];


            let yScaleMultiplier = 1
            //console.log(render.path, point, rotation)

            for (let animation of animationBindings) {
                if (animation.binding == 'yscale') {
                    yScaleMultiplier = animationValues[animation.index]
                }
            }

            for (let shape of render.baseShapes) {
                let newYScaleMultiplier = yScaleMultiplier
                //console.log(shape.type)

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
                    //ctx.beginPath();
                    let fillPreset = colorList['barrelGrey'].fill
                    let strokePreset = colorList['barrelGrey'].stroke
                    //console.log(sizeMultiplier)
                    //console.log(render.path, { 'z-index': zIndex, 'type': shape.type, 'dimensions': shape.size, 'offset': shape.offset, 'rotation': rotation, 'center': point, 'multipliers': { 'global': sizeMultiplier, 'x': 1, 'y': newYScaleMultiplier }, 'aspect': aspect, 'colors': { 'fill': fillPreset, 'stroke': strokePreset } })
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
                    //ctx.beginPath();
                    let fillPreset = colorList['barrelGrey'].fill
                    let strokePreset = colorList['barrelGrey'].stroke

                    renderList.push({ 'z-index': zIndex, 'type': shape.type, 'dimensions': shape.size, 'offset': shape.offset, 'rotation': rotation, 'center': point, 'multipliers': { 'global': sizeMultiplier, 'x': 1, 'y': newYScaleMultiplier }, 'aspect': aspect, 'colors': { 'fill': fillPreset, 'stroke': strokePreset } })
                }

            }


        }
    }
    renderList.sort((b, a) => b['z-index'] - a['z-index']);

    for (let renderObject of renderList) {
        renderer(renderObject, ctx);
    }
    ctx.lineWidth = 1 / GSRatio;
    ctx.globalAlpha = 1;

}
