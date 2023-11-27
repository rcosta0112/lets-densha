import * as THREE from 'three'

import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'

import Stats from 'three/addons/libs/stats.module.js'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'


// Controls

import * as CANNON from 'cannon-es'
import { PointerLockControlsCannon } from './js/PointerLockControlsCannon.js'
import { threeToCannon } from 'three-to-cannon'

import { AmbientAudio } from './js/AmbientAudio.js'

const basePath = import.meta.env.BASE_URL

const container = document.getElementById('container')
const loading = document.querySelector('.loading')

let camera, scene, composer, renderer, stats, ambientAudio
// let characters = new Array
let animationMixers = new Array()

let housesSource = new Array()
let housesAnimated = new Array()
let houseCreateTimer = 0
const maxHouses = 50
const houseCreateInterval = 50

// Pointer Lock Controls

// cannon.js variables
let world
let controls
const timeStep = 1 / 60
let lastCallTime = performance.now() / 1000
let sphereShape
let sphereBody
let physicsMaterial

const progressBar = document.querySelector('.progress-bar-inner')

initCannon()
init()
initPointerLock()

animate()


function init() {

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x87ced5, 50, 300)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(1) // USE THIS FOR QUALITY SELECTOR
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.gammaFactor = 1
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.outputEncoding = THREE.sRGBEncoding

  container.appendChild(renderer.domElement)

  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
  // Y controls the camera height
  camera.position.set(0, 1.1, 0)

  //
  // Post Processing
  //

  const renderScene = new RenderPass(scene, camera)

  composer = new EffectComposer(renderer)
  composer.addPass(renderScene)

  ambientAudio = new AmbientAudio(camera)

  // Ocean Plane
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshBasicMaterial({ color: 0x4dadcb, depthWrite: false }))
  ocean.rotation.x = - Math.PI / 2
  scene.add(ocean)


  //
  //  Loading external assets
  //

  const loadingManager = new THREE.LoadingManager()
  loadingManager.onProgress = (item, loaded, total) => {
    let progress = Math.round(loaded * 100 / total)
    // loadingLabel.innerHTML = "Loading " + progress + "%"
    progressBar.style.width = progress + "%"
  }

  async function loadModels() {

    const loader = new GLTFLoader(loadingManager).setPath(basePath + 'models/')
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(basePath + 'libs/draco/')
    loader.setDRACOLoader(dracoLoader)

    const ktx2Loader = new KTX2Loader().setTranscoderPath(basePath + 'libs/basis/').detectSupport(renderer)

    loader.setKTX2Loader(ktx2Loader)
    loader.setMeshoptDecoder(MeshoptDecoder)

    const [...model] = await Promise.all([
      loader.loadAsync('train.glb'),
      loader.loadAsync('collision.glb'),
      loader.loadAsync('background.glb'),
      loader.loadAsync('rails.glb'),
      loader.loadAsync('houses.glb'),
      loader.loadAsync('characters-2.glb'),
      loader.loadAsync('cars.glb'),
    ])

    // Train
    const train = model[0]
    scene.add(train.scene)

    // Collision Mesh
    const collision = model[1]
    collision.scene.children.forEach(function (node) {
      if (node.isMesh) {
        // Converts mesh to cannonjs
        // The collision mesh needs to be made mostly of boxes
        const { shape, offset, quaternion } = threeToCannon(node)
        // Add the shape to a CANNON.Body.
        let body = new CANNON.Body({ mass: 0, material: physicsMaterial })
        body.addShape(shape, offset, quaternion)
        body.position = node.position
        body.type = CANNON.Body.STATIC
        // Comment this out to disable collision
        world.addBody(body)
      }
    })


    // Ocean and ground
    scene.add(model[2].scene)

    // Animated bits
    /// The animations are stored on the root element of the GLTF file, not in the mesh
    const animatedElements = model[3]
    scene.add(animatedElements.scene)

    // Rails and road stripes
    const rails = scene.getObjectByName("Rails")
    let railsMixer = new THREE.AnimationMixer(rails)
    let railsAnimation = animatedElements.animations[0]
    railsMixer.clipAction(railsAnimation).play()
    animationMixers.push(railsMixer)

    // Houses

    // Puts all the models from the GLB in the houses array
    model[4].scene.children.forEach((house) => housesSource.push(house))

    // Prepopulate house array
    for (let ii = 0; ii <= maxHouses; ii++) {
      createHouse()
      housesAnimated.forEach((house) => {
        house.position.z -= 10
      })
    }

    // Cars
    scene.add(model[6].scene)


    //
    // Characters
    //

    //
    // In Blender
    // This is one unique action per unique character, so I'm selecting them in the actions editor
    // No need for NLA strips
    // Bake any noise modifiers (on the 3D viewport: F3 then Bake Action)
    // Export as gltf 
    // Animation mode: actions
    // 

    const characters = model[5]
    scene.add(characters.scene)

    // Animations go in the root glb object. Not inside each child
    // Not sure what happens if a child object doesn't have an animation.
    // It will probably break

    characters.scene.children.forEach((character, index) => {
      let mixer = new THREE.AnimationMixer(character)
      mixer.clipAction(characters.animations[index]).play()
      animationMixers.push(mixer)
    })

    // Shows UI
    instructions.classList.add("in")
    loading.classList.remove('in')

  }

  new EXRLoader(loadingManager).setPath(basePath + 'images/textures/').load('skybox.exr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.colorSpace = THREE.SRGBColorSpace
    scene.background = texture
  })

  loadModels()


  // Stats widget

  stats = new Stats()
  document.body.appendChild(stats.dom)

  window.addEventListener('resize', onWindowResize)

} // /Init


function initCannon() {
  // Setup world
  world = new CANNON.World()

  // Tweak contact properties.
  // Contact stiffness - use to make softer/harder contacts
  world.defaultContactMaterial.contactEquationStiffness = 1e9

  // Stabilization time in number of timesteps
  world.defaultContactMaterial.contactEquationRelaxation = 4

  const solver = new CANNON.GSSolver()
  solver.iterations = 7
  solver.tolerance = 0.1
  world.solver = new CANNON.SplitSolver(solver)
  // use this to test non-split solver
  // world.solver = solver

  world.gravity.set(0, -2, 0)

  world.broadphase.useBoundingBoxes = true

  physicsMaterial = new CANNON.Material('physics')
  const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
    friction: 0.0,
    restitution: 0.3,
  })

  world.addContactMaterial(physics_physics)

  // Create the user collision sphere
  const radius = 1
  sphereShape = new CANNON.Sphere(radius)
  sphereBody = new CANNON.Body({ mass: 5, material: physicsMaterial })
  sphereBody.addShape(sphereShape)
  sphereBody.position.set(0, 1.1, 0)
  sphereBody.linearDamping = 0.9
  world.addBody(sphereBody)

  // Create the ground plane
  const groundShape = new CANNON.Plane()
  const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial })
  groundBody.addShape(groundShape)
  groundBody.position.set(0, 0.02, 0) // There's a little offset on the model  
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
  world.addBody(groundBody)
}


function initPointerLock() {

  const instructions = document.getElementById('instructions')
  const aboutPage = document.querySelector('.about')
  const startButton = document.querySelector('.start-button')
  const aboutButton = document.querySelector('.about-button')
  const backButton = document.querySelector('.back-button')

  instructions.classList.remove("in")

  controls = new PointerLockControlsCannon(camera, sphereBody)
  controls.velocityFactor = 0.075
  controls.jumpVelocity = 0
  scene.add(controls.getObject())

  startButton.addEventListener('click', () => {
    controls.lock()
  })

  controls.addEventListener('lock', () => {
    controls.enabled = true
    container.classList.add('in')
    instructions.classList.remove("in")
    ambientAudio.play()
  })

  controls.addEventListener('unlock', () => {
    controls.enabled = false
    container.classList.remove('in')
    instructions.classList.add("in")
    ambientAudio.pause()
  })

  aboutButton.addEventListener('click', () => {
    aboutPage.style.display = 'flex'
    instructions.classList.remove("in")
  })

  backButton.addEventListener('click', () => {
    aboutPage.style.display = 'none'
    instructions.classList.add("in")
  })

}


//
// Misc
//

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}



//
// ANIMATE
//

var frameCounter = 0

function animate() {

  requestAnimationFrame(animate)

  const time = performance.now() / 1000
  const delta = time - lastCallTime
  lastCallTime = time

  if (controls.enabled) world.step(timeStep, delta)

  // Animations
  animationMixers.forEach((mixer) => mixer.update(delta))

  // Houses
  animateHouses()

  controls.update(delta)
  stats.update()

  composer.render()

}

function animateHouses() {

  houseCreateTimer++

  if (houseCreateTimer > houseCreateInterval) {
    createHouse()
    houseCreateTimer = 0
  }

  housesAnimated.forEach((house) => {
    house.position.z -= 0.2
  })

}

function createHouse() {

  // Creates random house
  const house = housesSource[Math.round(Math.round(Math.random() * (housesSource.length - 1)))].clone()
  housesAnimated.push(house)
  house.position.set(-51.6, 0, 200)
  house.rotation.y = (Math.PI / 2) * Math.round(Math.random() * 4)
  // const randomScale = Math.random() + 0.9
  // house.scale.set(randomScale, randomScale, randomScale)
  scene.add(house)

  // remove excess houses
  scene.remove(housesAnimated[0])
  if (housesAnimated.length > maxHouses) housesAnimated.shift()

}


