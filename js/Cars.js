//
// Cars
//


class Cars {
    
    constructor(scene, source) {

        this.scene = scene
        this.carsSource = source
        this.carsAnimated = new Array()
        this.carCreateTimer = 0
        this.maxCars = 15
        this.carCreateInterval = 100

        // Prepopulate car array
        for (let ii = 0; ii <= this.maxCars; ii++) {
            this.createCar()
            this.carsAnimated.forEach((car) => {
                car.position.z -= 40
            })
        }

        this.animateCars = function () {

            this.carCreateTimer++

            if (this.carCreateTimer > this.carCreateInterval) {
                this.createCar()
                this.carCreateTimer = 0
            }

            this.carsAnimated.forEach((car) => {
                car.position.z -= 0.35
            })

        }

    }

    createCar() {

        // Creates random car
        const car = this.carsSource[Math.round(Math.random() * (this.carsSource.length - 1))].clone()
        this.carsAnimated.push(car)
        car.position.set(-18.37, -0.661, 200)
        car.rotation.y = (Math.PI / 1)
        this.scene.add(car)

        // remove excess cars
        this.scene.remove(this.carsAnimated[0])
        if (this.carsAnimated.length > this.maxCars) this.carsAnimated.shift()

        // randomize car creation interval
        this.carCreateInterval = Math.round(Math.random() * 100) + 50

    }

}

export { Cars }