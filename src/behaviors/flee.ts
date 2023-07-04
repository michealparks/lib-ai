import * as THREE from 'three'
import type { Vehicle } from '../vehicle'
import { SteeringBehavior } from './steering'

const desiredVelocity = new THREE.Vector3()

/**
* This steering behavior produces a force that steers an agent away from a target position.
* It's the opposite of {@link SeekBehavior}.
*/
export class FleeBehavior extends SteeringBehavior {
  /**
   * The target vector.
   */
  target: THREE.Vector3

  /**
   * The agent only flees from the target if it is inside this radius.
   * @default 10
   */
  panicDistance = 10

	/**
	 * Constructs a new flee behavior.
	 *
	 * @param target - The target vector.
	 * @param panicDistance - The agent only flees from the target if it is inside this radius.
	 */
	constructor(target = new THREE.Vector3(), panicDistance = 10) {
		super()
		this.target = target
		this.panicDistance = panicDistance;
	}

	/**
	* Calculates the steering force for a single simulation step.
	*
	* @param vehicle - The game entity the force is produced for.
	* @param force - The force/result vector.
	* @returns The force/result vector.
	*/
	calculate(vehicle: Vehicle, force: THREE.Vector3): THREE.Vector3 {
		const { target } = this

		// only flee if the target is within panic distance
		const distanceToTargetSq = vehicle.position.distanceToSquared(target)

		if (distanceToTargetSq <= (this.panicDistance ** 2)) {
			// from here, the only difference compared to seek is that the desired
			// velocity is calculated using a vector pointing in the opposite direction
			desiredVelocity.subVectors(vehicle.position, target).normalize()

			// if target and vehicle position are identical, choose default velocity
			if (desiredVelocity.lengthSq() === 0) {
				desiredVelocity.set(0, 0, 1)
			}

			desiredVelocity.multiplyScalar(vehicle.maxSpeed)
			force.subVectors(desiredVelocity, vehicle.velocity)
		}

		return force
	}
}
