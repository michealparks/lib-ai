import * as THREE from 'three'
import type { Vehicle } from '../vehicle'

const vec3 = new THREE.Vector3()

/**
* Base class for all concrete steering behaviors. They produce a force that describes
* where an agent should move and how fast it should travel to get there.
*
* Note: All built-in steering behaviors assume a {@link Vehicle#mass} of one. Different values can lead to an unexpected results.
*/
export class SteeringBehavior {
  /**
  * Whether this steering behavior is active or not.
  * @default true
  */
  active = true

  /**
  * Can be used to tweak the amount that a steering force contributes to the total steering force.
  * @default 1
  */
  weight = 1

  calculate(vehicle: Vehicle, force: THREE.Vector3, delta: number): THREE.Vector3 {
    return vec3
  }
}
