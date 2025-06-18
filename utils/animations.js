class Animator {
    constructor(type, maxT) {

        this.animationType = type;
        this.maxT = maxT;
        this.keyframes = animationPresets[this.animationType].keyframes

    }
    getCurrentKeyFrame(t) {
        let percentage = t / this.maxT;
        let previousKeyFrameI = 0;

        if (this.keyframes[0].tOccurs < percentage) {
            while (this.keyframes[previousKeyFrameI].tOccurs < percentage && previousKeyFrameI < this.keyframes.length) {
                previousKeyFrameI++;

            }
            previousKeyFrameI += -1
        } else {
            previousKeyFrameI = 0;
        }

        let nextKeyFrame = this.keyframes[previousKeyFrameI + 1]
        let previousKeyFrame = this.keyframes[previousKeyFrameI]

        let percentThrough = ((percentage - previousKeyFrame.tOccurs) / (nextKeyFrame.tOccurs - previousKeyFrame.tOccurs))

        let sizeMultiplierXDifference = nextKeyFrame.sizeMultipliers.x - previousKeyFrame.sizeMultipliers.x
        let sizeMultiplierYDifference = nextKeyFrame.sizeMultipliers.y - previousKeyFrame.sizeMultipliers.y

        let newSizeMultiplier = {
            'x': previousKeyFrame.sizeMultipliers.x + sizeMultiplierXDifference * percentThrough,
            'y': previousKeyFrame.sizeMultipliers.y + sizeMultiplierYDifference * percentThrough
        }

        let offsetXDifference = nextKeyFrame.positionOffset.x - previousKeyFrame.positionOffset.x
        let offsetYDifference = nextKeyFrame.positionOffset.y - previousKeyFrame.positionOffset.y

        let newPositionOffset = {
            'x': previousKeyFrame.positionOffset.x + offsetXDifference * percentThrough,
            'y': previousKeyFrame.positionOffset.y + offsetYDifference * percentThrough
        }

        let rotationOffsetDifference = nextKeyFrame.rotationOffset - previousKeyFrame.rotationOffset

        let newRotationOffset = previousKeyFrame.rotationOffset + rotationOffsetDifference * percentThrough

        return { 'sizeMultipliers': newSizeMultiplier, 'positionOffset': newPositionOffset, 'rotationOffset': newRotationOffset }
    }
}

class AnimationKeyFrame {
    constructor(tOccurs, sizeMultipliers, positionOffset, rotationOffset) {

        this.tOccurs = tOccurs;
        this.sizeMultipliers = sizeMultipliers;
        this.positionOffset = positionOffset;
        this.rotationOffset = rotationOffset * (Math.PI / 180);

    }
}

const animationPresets = {
    'standardRecoil': {
        'keyframes': [
            new AnimationKeyFrame(0, { 'x': 1, 'y': 1 }, { 'x': 0, 'y': 0 }, 0),

            new AnimationKeyFrame(0.3, { 'x': 1.05, 'y': 0.7 }, { 'x': 0, 'y': 0 }, 0),

            new AnimationKeyFrame(1, { 'x': 1, 'y': 1 }, { 'x': 0, 'y': 0 }, 0)
        ]
    }
}