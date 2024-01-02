//
// Clouds
//


class Clouds {

    constructor(scene, cloudsSource, camera) {

        this.scene = scene
        this.cloudsSource = cloudsSource
        this.cloudsAnimated = new Array()
        this.cloudCreateTimer = 0
        this.maxClouds = 150
        this.cloudCreateInterval = 1000
        this.cloudSpacing = 8000
        this.cloudSpeed = 10
        this.cloudDepth = 30000
        this.cloudStartZ = 100000


        // Prepopulate cloud array
        for (let ii = 0; ii <= this.maxClouds; ii++) {
            this.createCloud()
            this.cloudsAnimated.forEach((cloud) => {
                cloud.position.z -= this.cloudSpacing
            })
        }

        this.animateClouds = function () {

            this.cloudCreateTimer++

            if (this.cloudCreateTimer > this.cloudCreateInterval) {
                this.createCloud()
                this.cloudCreateTimer = 0
            }

            this.cloudsAnimated.forEach((cloud) => {
                cloud.position.z -= Math.random() * 5 + this.cloudSpeed
            })


        }

    }


    createCloud() {

        // Creates random cloud
        const cloud = this.cloudsSource[Math.round(Math.random() * (this.cloudsSource.length - 1))].clone()

        this.cloudsAnimated.push(cloud)
        cloud.position.set(
            Math.random() * this.cloudDepth + this.cloudDepth,
            1000,
            this.cloudStartZ) // Train follows the Z axis
        var randomScale = Math.random() * 70 + 70
        cloud.scale.set(randomScale, randomScale, randomScale)
        this.scene.add(cloud)

        // remove excess clouds
        this.scene.remove(this.cloudsAnimated[0])
        if (this.cloudsAnimated.length > this.maxClouds) this.cloudsAnimated.shift()

    }

}

export { Clouds }