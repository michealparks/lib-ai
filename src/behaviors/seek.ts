import * as THREE from 'three'
import type { Vehicle } from '../vehicle';
import { SteeringBehavior } from './steering'

const desiredVelocity = new THREE.Vector3();

/**
* This steering behavior produces a force that directs an agent toward a target position.
*/
export class SeekBehavior extends SteeringBehavior {
  /**
   * The target vector.
   */
  target: THREE.Vector3

	/**
	* Constructs a new seek behavior.
	*
	* @param target - The target vector.
	*/
	constructor(target = new THREE.Vector3()) {
		super()
		this.target = target
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

		// First the desired velocity is calculated.
		// This is the velocity the agent would need to reach the target position in an ideal world.
		// It represents the vector from the agent to the target,
		// scaled to be the length of the maximum possible speed of the agent.
		desiredVelocity.subVectors(target, vehicle.position).normalize()
		desiredVelocity.multiplyScalar(vehicle.maxSpeed)

		// The steering force returned by this method is the force required,
		// which when added to the agent’s current velocity vector gives the desired velocity.
		// To achieve this you simply subtract the agent’s current velocity from the desired velocity.
		// return force.subVectors(desiredVelocity, vehicle.velocity)
		return force.copy(desiredVelocity)
	}
}
