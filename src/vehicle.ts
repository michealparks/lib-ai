import * as THREE from 'three'
import { vector } from 'three-kit'
import { SteeringManager } from './steering-manager'
import type { Smoother } from './smoother'

const m4 = new THREE.Matrix4()
const displacement = new THREE.Vector3()
const target = new THREE.Vector3()
const acceleration = new THREE.Vector3()
const velocitySmooth = new THREE.Vector3()
const targetDirection = new THREE.Vector3()

/**
* This type of game entity implements a special type of locomotion, the so called
* *Vehicle Model*. The class uses basic physical metrics in order to implement a
* realistic movement.
*/
export class Vehicle {
  /**
  * Whether this game entity is active or not.
  * @default true
  */
  active = true

  /**
  * The name of this game entity.
  */
  name = ''

  /**
   * The default forward vector of this game entity.
   * @default (0,0,1)
   */
  forward = vector.FORWARD.clone()

  /**
   * The default up vector of this game entity.
   * @default (0,1,0)
   */
  up = vector.UP.clone()

  /**
  * A list of neighbors of this game entity.
  */
  readonly neighbors: Vehicle[] = []

  /**
  * Game entities within this radius are considered as neighbors of this entity.
  * @default 1
  */
  neighborhoodRadius = 1

  /**
  * Whether the neighborhood of this game entity is updated or not.
  * @default false
  */
  updateNeighborhood = false

  /**
  * The velocity of this game entity.
  */
  velocity = new THREE.Vector3()

  /**
   * The current steering force of this game entity.
   */
  force = new THREE.Vector3()

  /**
  * The maximum speed at which this game entity may travel.
  * @default 1
  */
  maxSpeed = 1

  /**
  * Whether the orientation of this game entity will be updated based on the velocity or not.
  * @default false
  */
  updateOrientation = false

  /**
   * The entity's mesh
   */
  mesh: THREE.Mesh | THREE.InstancedMesh

  /**
   * The mesh's instance, if a THREE.InstancedMesh
   */
  instance = -1

  position = new THREE.Vector3()
  rotation = new THREE.Quaternion()

  /**
   * The mass of the vehicle in kilogram.
   * @default 1
   */
  mass = 1

  /**
   * The maximum force this entity can produce to power itself.
   * @default 100
   */
  maxForce = 100

  /**
	 * The steering manager of this vehicle.
	 */
	steering = new SteeringManager(this)

  /**
   * An optional smoother to avoid shakiness due to conflicting steering behaviors.
   * @default null
   */
  smoother: Smoother | null = null

  /**
	* Constructs a new vehicle.
	*/
  constructor (mesh: THREE.Mesh, instance = -1) {
    this.mesh = mesh
    this.instance = instance
    
    if (this.instance > -1) {
      const imesh = mesh as THREE.InstancedMesh
      imesh.getMatrixAt(instance, m4)
      this.rotation.setFromRotationMatrix(m4)
      this.position.setFromMatrixPosition(m4)
    } else {
      this.rotation.copy(mesh.quaternion)
      this.position.copy(mesh.position)
    }
  }

  	/**
	* Computes the current direction (forward) vector of this game entity
	* and stores the result in the given vector.
	*
	* @param result - The direction vector of this game entity.
	* @returns The direction vector of this game entity.
	*/
	getDirection (result: THREE.Vector3): THREE.Vector3 {
		return result.copy(this.forward).applyQuaternion(this.rotation).normalize()
	}

  /**
	 * Returns the current speed of this game entity.
	 *
	 * @returns The current speed.
	 */
	getSpeed (): number {
		return this.velocity.length()
	}

	/**
	 * Returns the current speed in squared space of this game entity.
	 *
	 * @returns The current speed in squared space.
	 */
	getSpeedSquared (): number {
		return this.velocity.lengthSq()
	}

  /**
	* Directly rotates the entity so it faces the given target position.
	*
	* @param target - The target position.
	* @returns A reference to this game entity.
	*/
	lookAt(target: THREE.Vector3): Vehicle {
    targetDirection.subVectors(target, this.position).normalize()
    m4.lookAt(this.forward, targetDirection, this.up)
		this.rotation.setFromRotationMatrix(m4)
		return this;
	}

  /**
	* This method is responsible for updating the position based on the force produced
	* by the internal steering manager.
	*
	* @param delta - The time delta.
	* @returns A reference to this vehicle.
	*/
	update (delta: number): Vehicle {
    // Estimate velocity
    displacement.copy(this.mesh.position)
    displacement.sub(this.position)
    this.velocity.copy(displacement).divideScalar(delta)

    // Update position
    if (this.instance > -1) {
      const mesh = this.mesh as THREE.InstancedMesh
      mesh.getMatrixAt(this.instance, m4)
      this.rotation.setFromRotationMatrix(m4)
      this.position.setFromMatrixPosition(m4)
    } else {
      this.rotation.copy(this.mesh.quaternion)
      this.position.copy(this.mesh.position)
    }

		// calculate steering force
		this.steering.calculate(delta, this.force)

		// acceleration = force / mass
		// acceleration.copy(this.force).divideScalar(this.mass)

		// update velocity
		// this.velocity.add(acceleration.multiplyScalar(delta))

		// make sure vehicle does not exceed maximum speed
		// if (this.getSpeedSquared() > (this.maxSpeed ** 2)) {
		// 	this.velocity.normalize()
		// 	this.velocity.multiplyScalar(this.maxSpeed)
		// }

		// calculate displacement
		// displacement.copy(this.velocity).multiplyScalar(delta)

		// calculate target position
		target.copy(this.position).add(displacement)

		// update the orientation if the vehicle has a non zero velocity
		if (this.updateOrientation === true && this.smoother === null && this.getSpeedSquared() > 0.00000001) {
			this.lookAt(target)
		}

		// update position
		// this.position.copy( target )

		// if smoothing is enabled, the orientation (not the position!) of the vehicle is
		// changed based on a post-processed velocity vector
		if (this.updateOrientation === true && this.smoother !== null) {
			this.smoother.calculate(this.velocity, velocitySmooth)

			displacement.copy(velocitySmooth).multiplyScalar(delta)
			target.copy(this.position).add(displacement)
			this.lookAt(target)
		}

		return this
	}
}
