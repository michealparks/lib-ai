import * as THREE from 'three'
import type { Vehicle } from './vehicle.js'
import { SteeringBehavior } from './behaviors/steering'

const force = new THREE.Vector3()

/**
* This class is responsible for managing the steering of a single vehicle. The steering manager
* can manage multiple steering behaviors and combine their produced force into a single one used
* by the vehicle.
*/
export class SteeringManager {
  /**
   * The vehicle that owns this steering manager.
   */
  vehicle: Vehicle

  /**
   * A list of all steering behaviors.
   * @readonly
   */
  behaviors: SteeringBehavior[] = []

  // the calculated steering force per simulation step
  #steeringForce = new THREE.Vector3()
  // used for deserialization of custom behaviors
	#typesMap = new Map() 

	/**
	 * Constructs a new steering manager.
	 *
	 * @param vehicle - The vehicle that owns this steering manager.
	 */
	constructor(vehicle: Vehicle) {
		this.vehicle = vehicle
	}

	/**
	 * Adds the given steering behavior to this steering manager.
	 *
	 * @param behavior - The steering behavior to add.
	 * @returns A reference to this steering manager.
	 */
	add(behavior: SteeringBehavior): SteeringManager {
		this.behaviors.push(behavior)
		return this
	}

	/**
	 * Removes the given steering behavior from this steering manager.
	 *
	 * @param behavior - The steering behavior to remove.
	 * @returns A reference to this steering manager.
	 */
	remove(behavior: SteeringBehavior): SteeringManager {
		this.behaviors.splice(this.behaviors.indexOf(behavior), 1)
		return this
	}

	/**
	 * Clears the internal state of this steering manager.
	 *
	 * @returns A reference to this steering manager.
	 */
	clear(): SteeringManager {
    this.behaviors.splice(0, this.behaviors.length)
		return this
	}

	/**
	 * Calculates the steering forces for all active steering behaviors and
	 * combines it into a single result force. This method is called in
	 * {@link Vehicle#update}.
	 *
	 * @param delta - The time delta.
	 * @param result - The force/result vector.
	 * @returns The force/result vector.
	 */
	calculate(delta: number, result: THREE.Vector3): THREE.Vector3 {
		this.#calculateByOrder(delta)
		return result.copy(this.#steeringForce)
	}

	/**
   * this method calculates how much of its max steering force the vehicle has
	 * left to apply and then applies that amount of the force to add
   */
	#accumulate(forceToAdd: THREE.Vector3) {
		// calculate how much steering force the vehicle has used so far
		const magnitudeSoFar = this.#steeringForce.length()

		// calculate how much steering force remains to be used by this vehicle
		const magnitudeRemaining = this.vehicle.maxForce - magnitudeSoFar

		// return false if there is no more force left to use
		if (magnitudeRemaining <= 0) return false

		// calculate the magnitude of the force we want to add
		const magnitudeToAdd = forceToAdd.length()

		// restrict the magnitude of forceToAdd, so we don't exceed the max force of the vehicle
		if (magnitudeToAdd > magnitudeRemaining) {
			forceToAdd.normalize().multiplyScalar(magnitudeRemaining)
		}

		// add force
		this.#steeringForce.add(forceToAdd)

		return true
	}

	#calculateByOrder(delta: number) {
		const behaviors = this.behaviors

		// reset steering force
		this.#steeringForce.set(0, 0, 0)

		// calculate for each behavior the respective force
		for (let i = 0, l = behaviors.length; i < l; i += 1) {
			const behavior = behaviors[i]

			if (behavior.active === true) {
				force.set(0, 0, 0)
				behavior.calculate(this.vehicle, force, delta)
				force.multiplyScalar( behavior.weight )

				if (this.#accumulate(force) === false) return
			}
		}
	}
}
