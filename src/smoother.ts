import * as THREE from 'three'

/**
* This class can be used to smooth the result of a vector calculation. One use case
* is the smoothing of the velocity vector of game entities in order to avoid a shaky
* movements due to conflicting forces.
*/
export class Smoother {
  /**
   * The amount of samples the smoother will use to average a vector.
   * @default 10
   */
  count = 10

  // this holds the history
  #history: THREE.Vector3[] = []
  // the current sample slot
	#slot = 0

	/**
	* Constructs a new smoother.
	*
	* @param count - The amount of samples the smoother will use to average a vector.
	*/
	constructor(count = 10) {
    this.count = count

		// initialize history with Vector3s
		for (let i = 0, l = this.count; i < l; i += 1) {
			this.#history[i] = new THREE.Vector3()
		}
	}

	/**
	* Calculates for the given value a smooth average.
	*
	* @param value - The value to smooth.
	* @param average - The calculated average.
	* @returns The calculated average.
	*/
	calculate(value: THREE.Vector3, average: THREE.Vector3): THREE.Vector3 {
		// ensure, average is a zero vector
		average.set(0, 0, 0)

		// make sure the slot index wraps around
		if ( this.#slot === this.count) {
			this.#slot = 0
		}

		// overwrite the oldest value with the newest
		this.#history[this.#slot].copy(value)

		// increase slot index
		this.#slot += 1

		// now calculate the average of the history array
		for ( let i = 0, l = this.count; i < l; i += 1) {
			average.add(this.#history[i])
		}

		average.divideScalar(this.count)
		return average
	}
}
