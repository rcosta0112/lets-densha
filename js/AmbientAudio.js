//
// Ambient Audio
//

import * as THREE from 'three'

class AmbientAudio {
    constructor(camera) {

        this.announcementPlayed = false

        // create an AudioListener and add it to the camera
        const listener = new THREE.AudioListener()
        camera.add(listener)

        // create a global audio source
        this.ambientAudio = new THREE.Audio(listener)

        // load a sound and set it as the Audio object's buffer
        const audioLoader = new THREE.AudioLoader()
        audioLoader.load('sounds/ambient_compressed.mp3', (buffer) => {
            this.ambientAudio.setBuffer(buffer)
            this.ambientAudio.setLoop(true)
            this.ambientAudio.setVolume(10)
        })


        // Anouncement
        this.anouncementAudio = new THREE.Audio(listener)

        const audioLoader2 = new THREE.AudioLoader()
        audioLoader2.load('sounds/B11_5N.mp3', (buffer) => {
            this.anouncementAudio.setBuffer(buffer)
            this.anouncementAudio.setLoop(false)
            this.anouncementAudio.setVolume(0.3)
        })



    }

    play() {

        this.ambientAudio.play()

        // Announcement only plays once
        if (!this.announcementPlayed) {
            setTimeout(() => { this.anouncementAudio.play() }, 1000)
            this.announcementPlayed = true
        }
    }

    pause() {
        this.ambientAudio.pause()
        this.anouncementAudio.pause()
    }

}

export { AmbientAudio }