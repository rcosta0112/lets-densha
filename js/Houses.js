//
// Houses and Trees
//


class Houses {
    
    constructor(scene, housesSource) {

        this.scene = scene
        this.housesSource = housesSource
        this.housesAnimated = new Array()
        this.houseCreateTimer = 0
        this.maxHouses = 55
        this.houseCreateInterval = 50

        // // Puts all the models from the GLB in the houses array
        // houses.forEach((house) => housesSource.push(house))

        // Prepopulate house array
        for (let ii = 0; ii <= this.maxHouses; ii++) {
            this.createHouse()
            this.housesAnimated.forEach((house) => {
                house.position.z -= 10
            })
        }

        this.animateHouses = function () {

            this.houseCreateTimer++

            if (this.houseCreateTimer > this.houseCreateInterval) {
                this.createHouse()
                this.houseCreateTimer = 0
            }

            this.housesAnimated.forEach((house) => {
                house.position.z -= 0.2
            })

        }

    }

    createHouse() {

        // Creates random house
        const house = this.housesSource[Math.round(Math.random() * (this.housesSource.length - 1))].clone()
        this.housesAnimated.push(house)
        house.position.set(-51.6, -0.661, 200)
        house.rotation.y = (Math.PI / 2) * Math.round(Math.random() * 4)
        // const randomScale = Math.random() + 0.9
        // house.scale.set(randomScale, randomScale, randomScale)
        this.scene.add(house)

        // remove excess houses
        this.scene.remove(this.housesAnimated[0])
        if (this.housesAnimated.length > this.maxHouses) this.housesAnimated.shift()

    }

}

export { Houses }