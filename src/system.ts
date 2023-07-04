import type { CellSpacePartitioning } from './partitioning/cell-space'
import type { Vehicle } from './vehicle'

export class System {
  /**
  * A list of {@link Vehicle vehicles}.
  * @readonly
  */
  entities: Vehicle[] = []

  /**
  * A reference to a spatial index.
  * @default null
  */
  spatialIndex: CellSpacePartitioning | null = null

  // used to manage triggers
  #triggers: Vehicle[] = []
  // used by spatial indices
  #indexMap = new Map()

  #candidates: Vehicle[] = []

  // #messageDispatcher = new MessageDispatcher()

  /**
	* Adds a game entity to this system.
	*
	* @param entity - The game entity to add.
	* @returns A reference to this system.
	*/
	add (entity: Vehicle): System {
		this.entities.push(entity);
		return this;
	}

  /**
	* Removes a game entity from this entity manager.
	*
	* @param entity - The game entity to remove.
	* @returns A reference to this entity manager.
	*/
	remove(entity: Vehicle): System {
		this.entities.splice(this.entities.indexOf(entity), 1)
		return this
	}

  /**
	* Clears the internal state of this entity manager.
	*
	* @return A reference to this entity manager.
	*/
	clear(): System {
    this.entities.splice(0, this.entities.length)
		// this.#messageDispatcher.clear()
		return this
	}

  /**
	* The central update method of this entity manager. Updates all
	* game entities and delayed messages.
	*
	* @param delta - The time delta.
	* @returns A reference to this entity manager.
	*/
	update (delta: number): System {
		const entities = this.entities
		const triggers = this.#triggers

		// update entities
    for (let i = 0, l = entities.length; i < l; i += 1) {
			this.updateEntity(entities[i], delta)
		}

		// process triggers (this is done after the entity update to ensure
		// up-to-date world matries)

    for (let i = 0, l = triggers.length; i < l; i += 1) {
			this.processTrigger(triggers[i])
		}

		triggers.splice(0, triggers.length)

		// handle messaging
		// this.#messageDispatcher.dispatchDelayedMessages(delta)

		return this
	}

	/**
	* Updates a single entity.
	*
	* @param entity - The game entity to update.
	* @param {Number} delta - The time delta.
	* @return {EntityManager} A reference to this entity manager.
	*/
	updateEntity(entity: Vehicle, delta: number ): System {
    if (entity.active === false) {
      return this
    }

    this.updateNeighborhood(entity)

    // update entity
    entity.update(delta)

    // if the entity is a trigger, save the reference for further processing
    // if (entity instanceof Trigger) {
    //   this.#triggers.push(entity);
    // }

    // update spatial index
    if (this.spatialIndex !== null) {
      let currentIndex = this.#indexMap.get(entity) ?? - 1;
      currentIndex = this.spatialIndex.updateEntity(entity, currentIndex);
      this.#indexMap.set(entity, currentIndex);
    }

    return this
	}

	/**
	* Updates the neighborhood of a single game entity.
	*
	* @param entity - The game entity to update.
	* @returns A reference to this entity manager.
	*/
	updateNeighborhood(entity: Vehicle): System {
    const candidates = this.#candidates
    if (entity.updateNeighborhood === false) {
      return this
    }

    entity.neighbors.splice(0, entity.neighbors.length)

    // determine candidates
    if (this.spatialIndex !== null) {
      this.spatialIndex.query(entity.position, entity.neighborhoodRadius, candidates);
    } else {
      // worst case runtime complexity with O(n²)
      candidates.splice(0, candidates.length)
      candidates.push(...this.entities)
    }

    // verify if candidates are within the predefined range
    const neighborhoodRadiusSq = entity.neighborhoodRadius ** 2

    for (let i = 0, l = candidates.length; i < l; i += 1) {
      const candidate = candidates[i]

      if (entity !== candidate && candidate.active === true) {
        const distanceSq = entity.position.distanceToSquared(candidate.position);

        if (distanceSq <= neighborhoodRadiusSq) {
          entity.neighbors.push(candidate)
        }
      }
    }

		return this
	}

	/**
	* Processes a single trigger.
	*
	* @param trigger - The trigger to process.
	* @return A reference to this entity manager.
	*/
	processTrigger(trigger: Trigger): System {
		trigger.updateRegion()

		const { entities } = this

    for (let i = 0, l = entities.length; i < l; i += 1) {
			const entity = entities[i]

			if (trigger !== entity && entity.active === true && entity.canActivateTrigger === true) {
				trigger.check(entity)
			}
		}

		return this
	}

	/**
	* Interface for game entities so they can send messages to other game entities.
	*
	* @param sender - The sender.
	* @param receiver - The receiver.
	* @param message - The actual message.
	* @param delay - A time value in millisecond used to delay the message dispatching.
	* @param data - An object for custom data.
	* @return A reference to this entity manager.
	*/
	sendMessage(sender: Vehicle, receiver: Vehicle, message: string, delay: number, data: unknown): System {
		// this.#messageDispatcher.dispatch(sender, receiver, message, delay, data)
		return this
	}

	run () {
		let then = performance.now()
		setInterval(() => {
			const time = performance.now()
			this.update(time - then)
			then = time
		}, 1000 / 30)
	}
}
