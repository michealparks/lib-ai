import './main.css'
import * as debug from '../src/debug'
import * as THREE from 'three'
import * as sword from 'sword'
import { camera, scene, run, update, lights } from 'three-kit'
import * as ai from '../src/main'
import { player, playerVehicle } from './player'

const m4 = new THREE.Matrix4()

const system = new ai.System()

const count = 10
const radius = 0.5
const geometry = new THREE.SphereGeometry(radius)
const material = new THREE.MeshStandardMaterial({ color: 'white' })
const mesh = new THREE.InstancedMesh(geometry, material, count)
scene.add(mesh)

const enemies: ai.Vehicle[] = []

for (let i = 0; i < count; i += 1) {
  m4.setPosition(i, 0, 0)
  mesh.setMatrixAt(i, m4)

  const vehicle = new ai.Vehicle(mesh, i)

  const wanderBehavior = new ai.WanderBehavior(Math.random() * 5)
  wanderBehavior.active = false

  const seekBehavior = new ai.SeekBehavior(player.position)
  seekBehavior.active = false

  const pursuitBehavior = new ai.PursuitBehavior(playerVehicle)
  pursuitBehavior.active = true

  vehicle.steering.add(wanderBehavior)
  vehicle.steering.add(pursuitBehavior)
  vehicle.steering.add(seekBehavior)
  system.add(vehicle)
  enemies.push(vehicle)
}

mesh.instanceMatrix.needsUpdate = true

const ids = await sword.createRigidBodies(mesh, {
  type: sword.RigidBodyType.Dynamic,
  collider: sword.ColliderType.Ball,
  radius: 0.5,
})

const ambient = lights.createAmbient(undefined, 0.5)
scene.add(ambient)

const directional = lights.createDirectional(undefined, 1.5)
directional.position.set(1, 1, 1)
directional.lookAt(0, 0, 0)
scene.add(directional)

system.add(playerVehicle)

update(() => {
  const forces = new Float32Array(count * 6)

  for (let i = 0, j = 0; i < count; i += 1, j += 6) {
    const force = system.entities[i].force
    forces[j + 0] = force.x
    forces[j + 1] = force.y
    forces[j + 2] = force.z
  }

  sword.setForces(new Uint16Array(ids), forces)
})

run()
sword.run()
system.run()

camera.position.set(0, 1, 1)
camera.lookAt(0, 0, 0)

const params = {
  maxSpeed: 1,
  maxForce: 1,
}

const handleChange = (param: string) => {
  for (const enemy of enemies) {
    enemy[param] = params[param]
  }
}

const pane = debug.addPane('demo')
pane.addInput(params, 'maxSpeed').on('change', () => handleChange('maxSpeed'))
pane.addInput(params, 'maxForce').on('change', () => handleChange('maxForce'))