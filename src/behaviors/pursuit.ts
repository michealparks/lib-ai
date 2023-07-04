import * as THREE from 'three'
import { SteeringBehavior } from './steering'
import { SeekBehavior } from './seek'
import type { Vehicle } from '../vehicle'

const displacement = new THREE.Vector3()
const vehicleDirection = new THREE.Vector3()
const evaderDirection = new THREE.Vector3()
const newEvaderVelocity = new THREE.Vector3()
const predictedPosition = new THREE.Vector3()

/**
* This steering behavior is useful when an agent is required to intercept a moving agent.
*/
export class PursuitBehavior extends SteeringBehavior {
  /**
  * The agent to pursue.
  * @default null
  */
  evader: Vehicle | null = null

  /**
  * This factor determines how far the vehicle predicts the movement of the evader.
  * @default 1
  */
  predictionFactor = 1

  // internal behaviors
  #seek = new SeekBehavior()

	/**
	* Constructs a new pursuit behavior.
	*
	* @param evader - The agent to pursue.
	* @param predictionFactor - This factor determines how far the vehicle predicts the movement of the evader.
	*/
	constructor(evader: Vehicle | null = null, predictionFactor = 1) {
		super()
		this.evader = evader
		this.predictionFactor = predictionFactor
	}

	/**
	* Calculates the steering force for a single simulation step.
	*
	* @param vehicle - The game entity the force is produced for.
	* @param force - The force/result vector.
	* @return The force/result vector.
	*/
	calculate(vehicle: Vehicle, force: THREE.Vector3): THREE.Vector3 {
		const { evader } = this

    if (evader === null) {
      return force
    }

		displacement.subVectors(evader.position, vehicle.position)

		// 1. if the evader is ahead and facing the agent then we can just seek for the evader's current position
		vehicle.getDirection(vehicleDirection)
		evader.getDirection(evaderDirection)

		// first condition: evader must be in front of the pursuer
		const evaderAhead = displacement.dot(vehicleDirection) > 0

		// second condition: evader must almost directly facing the agent
		const facing = vehicleDirection.dot(evaderDirection) < -0.95

		if (evaderAhead === true && facing === true) {
			this.#seek.target = evader.position
			this.#seek.calculate(vehicle, force)
			return force
		}

		// 2. evader not considered ahead so we predict where the evader will be
		// the lookahead time is proportional to the distance between the evader
		// and the pursuer. and is inversely proportional to the sum of the
		// agent's velocities
		let lookAheadTime = displacement.length() / (vehicle.maxSpeed + evader.getSpeed())

    // tweak the magnitude of the prediction
		lookAheadTime *= this.predictionFactor 

		// calculate new velocity and predicted future position
		newEvaderVelocity.copy(evader.velocity ).multiplyScalar( lookAheadTime )
		predictedPosition.addVectors( evader.position, newEvaderVelocity )

		// now seek to the predicted future position of the evader
		this.#seek.target = predictedPosition
		this.#seek.calculate( vehicle, force )

		return force
	}
}
