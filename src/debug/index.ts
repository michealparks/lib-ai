import 'sword/debug'
import * as debug from 'three-kit/debug'
import * as THREE from 'three'
import { scene, update } from 'three-kit'
import { System } from '../system'
import type { Vehicle } from '../vehicle'

const m4 = new THREE.Matrix4()
const { addPane } = debug

export { addPane }

const pane = addPane('ai')
const vehicles: Vehicle[] = []
const forces: THREE.ArrowHelper[] = []
const directions: THREE.ArrowHelper[] = []

const params = {
  force: false,
  direction: false,
}

pane.addInput(params, 'direction').on('change', () => {
  if (params.direction) {
    scene.add(...directions) 
  } else {
    scene.remove(...directions)
  }
})

pane.addInput(params, 'force').on('change', () => {
  if (params.force) {
    scene.add(...forces)
  } else {
    scene.remove(...forces)
  }
})

// const vehicleFolder = debug.addFolder(pane, 'vehicles')

const add = System.prototype.add
System.prototype.add = function (entity: Vehicle) {
  vehicles.push(entity)

  const force = new THREE.ArrowHelper()
  force.setLength(2, 0.5, 0.25)
  forces.push(force)

  const direction = new THREE.ArrowHelper()
  direction.setLength(2, 0.5, 0.25)
  direction.setColor('red')
  directions.push(direction)

  return add.call(this, entity)
}

const position = new THREE.Vector3()
const dir = new THREE.Vector3()

update(() => {
  if (!params.force && !params.direction) {
    return
  }

  for (let i = 0, l = vehicles.length; i < l; i += 1) {
    const vehicle = vehicles[i]

    if (vehicle.instance > -1) {
      const mesh = vehicle.mesh as THREE.InstancedMesh
      mesh.getMatrixAt(i, m4)
      position.setFromMatrixPosition(m4)
    } else {
      position.copy(vehicle.mesh.position)
    }

    if (params.force) {
      const force = forces[i]
      force.setDirection(vehicle.force)
      force.position.copy(position)
    }

    if (params.direction) {
      const direction = directions[i]
      vehicle.getDirection(dir)
      direction.setDirection(dir)
      direction.position.copy(position)
    }
  }
})
