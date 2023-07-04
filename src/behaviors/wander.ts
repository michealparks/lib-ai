import * as THREE from 'three'
import { SteeringBehavior } from './steering'
import type { Vehicle } from '../vehicle'
import { randFloat } from '../math'

const targetWorld = new THREE.Vector3()
const randomDisplacement = new THREE.Vector3()

/**
* This steering behavior produces a steering force that will give the
* impression of a random walk through the agent’s environment. The behavior only
* produces a 2D force (XZ).
*/
export class WanderBehavior extends SteeringBehavior {
  /**
   * The radius of the constraining circle for the wander behavior.
   * @default 1
   */
  radius = 1

  /**
   * The distance the wander sphere is projected in front of the agent.
   * @default 5
	 */
	distance = 5

  /**
   * The maximum amount of displacement along the sphere each frame.
   * @default 5
   */
  jitter = 5

  #targetLocal = new THREE.Vector3()

	/**
	* Constructs a new wander behavior.
	*
	* @param radius - The radius of the wander circle for the wander behavior.
	* @param distance - The distance the wander circle is projected in front of the agent.
	* @param jitter - The maximum amount of displacement along the sphere each frame.
	*/
	constructor(radius = 1, distance = 5, jitter = 5) {
		super()
		this.radius = radius
		this.distance = distance;
		this.jitter = jitter;
		this.generateRandomPointOnCircle(this.radius, this.#targetLocal)
	}

  generateRandomPointOnCircle(radius: number, target: THREE.Vector3): void {
    const theta = Math.random() * Math.PI * 2
    target.x = radius * Math.cos(theta)
    target.z = radius * Math.sin(theta)
  }

	/**
	* Calculates the steering force for a single simulation step.
	*
	* @param vehicle - The game entity the force is produced for.
	* @param force - The force/result vector.
	* @param delta - The time delta.
	* @return The force/result vector.
	*/
	override calculate(vehicle: Vehicle, force: THREE.Vector3, delta: number): THREE.Vector3 {
		// this behavior is dependent on the update rate, so this line must be
		// included when using time independent frame rate
		const jitterThisTimeSlice = this.jitter * delta;

		// prepare random vector
		randomDisplacement.x = randFloat(-1, 1) * jitterThisTimeSlice;
		randomDisplacement.z = randFloat(-1, 1) * jitterThisTimeSlice;

		// add random vector to the target's position
		this.#targetLocal.add(randomDisplacement)

		// re-project this new vector back onto a unit sphere
		this.#targetLocal.normalize()

		// increase the length of the vector to the same as the radius of the wander sphere
		this.#targetLocal.multiplyScalar(this.radius)

		// move the target into a position wanderDist in front of the agent
		targetWorld.copy(this.#targetLocal)
		targetWorld.z += this.distance

		// project the target into world space
    // @TODO instancedmesh
		targetWorld.applyMatrix4(vehicle.mesh.matrixWorld)

		// and steer towards it
		force.subVectors(targetWorld, vehicle.position)

		return force;
	}
}
