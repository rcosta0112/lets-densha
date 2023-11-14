//
// Ambient Audio
//

import * as THREE from 'three'

class AmbientAudio {
    constructor(camera) {

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

    }

    play(){
        this.ambientAudio.play()
    }

    pause(){
        this.ambientAudio.pause()
    }

}

export { AmbientAudio }