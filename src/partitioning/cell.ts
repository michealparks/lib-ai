import * as THREE from 'three'

/**
* Class for representing a single partition in context of cell-space partitioning.
*/
export class Cell {
  /**
   * The bounding volume of the cell.
   * @type {AABB}
   */
	aabb: THREE.Box3;

  /**
   * The list of entries which belong to this cell.
   * @readonly
   */
  entries = []
  
	/**
	* Constructs a new cell with the given values.
	*
	* @param aabb - The bounding volume of the cell.
	*/
	constructor(aabb = new THREE.Box3()) {
		this.aabb = aabb
	}

	/**
	* Adds an entry to this cell.
	*
	* @param entry - The entry to add.
	* @return A reference to this cell.
	*/
	add(entry): Cell {
		this.entries.push(entry)
		return this
	}

	/**
	* Removes an entry from this cell.
	*
	* @param {Any} entry - The entry to remove.
	* @return {Cell} A reference to this cell.
	*/
	remove(entry) {
		this.entries.splice(this.entries.indexOf(entry), 1)
		return this
	}

	/**
	* Removes all entries from this cell.
	*
	* @return A reference to this cell.
	*/
	makeEmpty(): Cell {
    this.entries.splice(0, this.entries.length)
		return this
	}

	/**
	* Returns true if this cell is empty.
	*
	* @returns Whether this cell is empty or not.
	*/
	empty(): boolean {
		return this.entries.length === 0
	}

	/**
	* Returns true if the given AABB intersects the internal bounding volume of this cell.
	*
	* @param aabb - The AABB to test.
	* @return Whether this cell intersects with the given AABB or not.
	*/
	intersects(aabb: THREE.Box3): boolean {
		return this.aabb.intersectsBox(aabb)
	}
}
