import * as THREE from 'three'
import type { Vehicle } from '../vehicle'
import { Cell } from './cell'

const clampedPosition = new THREE.Vector3()
const aabb = new THREE.Box3()
const contour = new Array()

/**
* This class is used for cell-space partitioning, a basic approach for implementing
* a spatial index. The 3D space is divided up into a number of cells. A cell contains a
* list of references to all the entities it contains. Compared to other spatial indices like
* octrees, the division of the 3D space is coarse and often not balanced but the computational
* overhead for calculating the index of a specific cell based on a position vector is very fast.
*/
export class CellSpacePartitioning {
  /**
   * The list of partitions.
   */
  cells: Cell[] = []

  /**
   * The width of the entire spatial index.
   */
  width = 0

  /**
  * The height of the entire spatial index.
  */
  height = 0

  /**
  * The depth of the entire spatial index.
  */
  depth = 0

  /**
  * The amount of cells along the x-axis.
  */
  cellsX = 0

  /**
  * The amount of cells along the y-axis.
  */
  cellsY = 0

  /**
  * The amount of cells along the z-axis.
  */
  cellsZ = 0

  #halfWidth = 0
  #halfHeight = 0
  #halfDepth = 0

  #min = new THREE.Vector3()
	#max = new THREE.Vector3()

	/**
	* Constructs a new spatial index with the given values.
	*
	* @param width - The width of the entire spatial index.
	* @param height - The height of the entire spatial index.
	* @param depth - The depth of the entire spatial index.
	* @param cellsX - The amount of cells along the x-axis.
	* @param cellsY - The amount of cells along the y-axis.
	* @param cellsZ - The amount of cells along the z-axis.
	*/
	constructor(width: number, height: number, depth: number, cellsX: number, cellsY: number, cellsZ: number) {
		this.width = width
		this.height = height
		this.depth = depth
		this.cellsX = cellsX
		this.cellsY = cellsY
		this.cellsZ = cellsZ

		this.#halfWidth = width / 2
		this.#halfHeight = height / 2
		this.#halfDepth = depth / 2

		this.#min.set(-this.#halfWidth, -this.#halfHeight, -this.#halfDepth)
		this.#max.set(this.#halfWidth, this.#halfHeight, this.#halfDepth)

		const cellSizeX = width / cellsX
		const cellSizeY = height / cellsY
		const cellSizeZ = depth / cellsZ

		for (let i = 0; i < cellsX; i += 1) {
			const x = (i * cellSizeX) - this.#halfWidth

			for ( let j = 0; j < cellsY; j += 1) {
				const y = (j * cellSizeY) - this.#halfHeight

				for (let k = 0; k < cellsZ; k += 1) {

					const z = ( k * cellSizeZ ) - this.#halfDepth

					const min = new THREE.Vector3()
					const max = new THREE.Vector3()

					min.set( x, y, z )

					max.x = min.x + cellSizeX
					max.y = min.y + cellSizeY
					max.z = min.z + cellSizeZ

					const aabb = new THREE.Box3( min, max )
					const cell = new Cell( aabb )

					this.cells.push( cell )
				}
			}
		}
	}

	/**
	* Updates the partitioning index of a given game entity.
	*
	* @param entity - The entity to update.
	* @param currentIndex - The current partition index of the entity.
	* @return The new partitioning index for the given game entity.
	*/
	updateEntity( entity: Vehicle, currentIndex = -1 ): number {
		const newIndex = this.getIndexForPosition( entity.position )

		if ( currentIndex !== newIndex ) {
			this.addEntityToPartition( entity, newIndex )

			if ( currentIndex !== -1 ) {
				this.removeEntityFromPartition( entity, currentIndex )
			}
		}

		return newIndex
	}

	/**
	* Adds an entity to a specific partition.
	*
	* @param entity - The entity to add.
	* @param index - The partition index.
	* @returns A reference to this spatial index.
	*/
	addEntityToPartition(entity: Vehicle, index: number): CellSpacePartitioning {
    this.cells[index].add( entity )
		return this
	}

	/**
	* Removes an entity from a specific partition.
	*
	* @param entity - The entity to remove.
	* @param index - The partition index.
	* @returns A reference to this spatial index.
	*/
	removeEntityFromPartition( entity: Vehicle, index: number ): CellSpacePartitioning {
		this.cells[ index ].remove( entity )
		return this
	}

	/**
	* Computes the partition index for the given position vector.
	*
	* @param position - The given position.
	* @returns The partition index.
	*/
	getIndexForPosition( position: THREE.Vector3 ): number {
		clampedPosition.copy( position ).clamp( this.#min, this.#max )

		let indexX = Math.abs( Math.floor( ( this.cellsX * ( clampedPosition.x + this.#halfWidth ) ) / this.width ) )
		let indexY = Math.abs( Math.floor( ( this.cellsY * ( clampedPosition.y + this.#halfHeight ) ) / this.height ) )
		let indexZ = Math.abs( Math.floor( ( this.cellsZ * ( clampedPosition.z + this.#halfDepth ) ) / this.depth ) )

		// handle index overflow
		if ( indexX === this.cellsX ) indexX = this.cellsX - 1
		if ( indexY === this.cellsY ) indexY = this.cellsY - 1
		if ( indexZ === this.cellsZ ) indexZ = this.cellsZ - 1

		// calculate final index
		return (indexX * this.cellsY * this.cellsZ) + (indexY * this.cellsZ) + indexZ
	}

	/**
	* Performs a query to the spatial index according the the given position and
	* radius. The method approximates the query position and radius with an AABB and
	* then performs an intersection test with all non-empty cells in order to determine
	* relevant partitions. Stores the result in the given result array.
	*
	* @param position - The given query position.
	* @param radius - The given query radius.
	* @param result - The result array.
	* @return The result array.
	*/
	query( position: THREE.Vector3, radius: number, result ) {
		const { cells } = this
    
    result.splice(0, result.length)

		// approximate range with an AABB which allows fast intersection test
		aabb.min.copy( position ).subScalar( radius )
		aabb.max.copy( position ).addScalar( radius )

		// test all non-empty cells for an intersection
		for ( let i = 0, l = cells.length; i < l; i += 1 ) {
			const cell = cells[ i ]

			if ( cell.empty() === false && cell.intersects( aabb ) === true ) {
				result.push( ...cell.entries )
			}
		}

		return result
	}

	/**
	* Removes all entities from all partitions.
	*
	* @return A reference to this spatial index.
	*/
	makeEmpty(): CellSpacePartitioning {
		const { cells } = this

		for ( let i = 0, l = cells.length; i < l; i += 1 ) {
			cells[ i ].makeEmpty()
		}

		return this
	}

	/**
	* Adds a polygon to the spatial index. A polygon is approximated with an AABB.
	*
	* @param {Polygon} polygon - The polygon to add.
	* @returns A reference to this spatial index.
	*/
	addPolygon( polygon ): CellSpacePartitioning {
		const { cells } = this

		polygon.getContour( contour )
		aabb.setFromPoints(contour)

		for ( let i = 0, l = cells.length; i < l; i += 1 ) {
			const cell = cells[ i ]

			if ( cell.intersects( aabb ) === true ) {
				cell.add( polygon )
			}
		}

		return this
	}
}
