import * as THREE from 'three'
import * as sword from 'sword'
import * as ai from '../src/main'
import { controls, scene, update, vector } from 'three-kit'

await sword.init(0, 0, 0)

const vec3 = new THREE.Vector3()
const quat = new THREE.Quaternion()
const m4 = new THREE.Matrix4()

const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
const mat = new THREE.MeshStandardMaterial({ color: 'lightblue' })
export const player = new THREE.Mesh(geo, mat)
scene.add(player)

const playerId = await sword.createRigidBody(player, {
  type: sword.RigidBodyType.KinematicPositionBased,
  collider: sword.ColliderType.Cuboid,
  hx: 0.25,
  hy: 0.25,
  hz: 0.25,
})

export const playerVehicle = new ai.Vehicle(player)

update(() => {
  const { keyboard } = controls
  player.position.x += keyboard.x / 10
  player.position.z -= keyboard.y / 10

  if (keyboard.x !== 0 || keyboard.y !== 0) {
    vec3.set(keyboard.x, 0, -keyboard.y)

    m4.lookAt(vector.ZERO, vec3, vector.UP)
    quat.setFromRotationMatrix(m4)

    player.quaternion.slerp(quat, 0.1)
  }

  sword.setNextKinematicTransform(
    playerId,
    { x: player.position.x, y: player.position.y, z: player.position.z },
    { x: player.quaternion.x, y: player.quaternion.y, z: player.quaternion.z, w: player.quaternion.w }
  )
})
