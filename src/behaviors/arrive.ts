import * as THREE from 'three'
import { SteeringBehavior } from './steering'
import type { SeekBehavior } from './seek'
import type { Vehicle } from '../vehicle'

const desiredVelocity = new THREE.Vector3()
const displacement = new THREE.Vector3()

/**
 * This steering behavior produces a force that directs an agent toward a target position.
 * Unlike {@link SeekBehavior}, it decelerates so the agent comes to a gentle halt at the target position.
 */
export class ArriveBehavior extends SteeringBehavior {
  /**
   * The target vector.
   */
  target: THREE.Vector3

  /**
   * The amount of deceleration.
   * @default 3
   */
  deceleration = 3

  /**
   * A tolerance value in world units to prevent the vehicle from overshooting its target.
   * @default 0
   */
  tolerance = 0

	/**
	 * Constructs a new arrive behavior.
	 *
	 * @param target - The target vector.
	 * @param deceleration - The amount of deceleration.
	 * @param tolerance - A tolerance value in world units to prevent the vehicle from overshooting its target.
	 */
	constructor(target = new THREE.Vector3(), deceleration = 3, tolerance = 0) {
		super()
		this.target = target
		this.deceleration = deceleration
		this.tolerance = tolerance
	}

	/**
	 * Calculates the steering force for a single simulation step.
	 *
	 * @param vehicle - The game entity the force is produced for.
	 * @param force - The force/result vector.
	 * @returns The force/result vector.
	 */
	calculate(vehicle: Vehicle, force: THREE.Vector3) {
		const { target, deceleration } = this

		displacement.subVectors(target, vehicle.position)

		const distance = displacement.length()

		if (distance > this.tolerance) {
			// calculate the speed required to reach the target given the desired deceleration
			let speed = distance / deceleration

			// make sure the speed does not exceed the max
			speed = Math.min( speed, vehicle.maxSpeed )

			// from here proceed just like "seek" except we don't need to normalize
			// the "displacement" vector because we have already gone to the trouble
			// of calculating its length.
			desiredVelocity.copy(displacement).multiplyScalar(speed / distance)
		} else {
			desiredVelocity.set(0, 0, 0)
		}

		return force.subVectors(desiredVelocity, vehicle.velocity)
	}
}
