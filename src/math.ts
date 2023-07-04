	/**
	* Computes a random float value within a given min/max range.
	*
	* @param min - The min value.
	* @param max - The max value.
	* @returns The random float value.
	*/
export const randFloat = (min: number, max: number): number => {
  return min + Math.random() * ( max - min )
}
