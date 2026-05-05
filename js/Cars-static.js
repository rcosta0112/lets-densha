//
// Static Cars
//


class CarsStatic {

    constructor(scene, source) {

        this.scene = scene
        this.cars = source
        this.speed = 0

        scene.add(this.cars)

        this.animateCars = function () {
            this.speed += (Math.random() - 0.5) / 500
            this.cars.position.z += this.speed
        }
    }

}

export { CarsStatic }