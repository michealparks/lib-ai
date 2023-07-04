import { copyDir } from './copydir.js'

await Promise.all([
  copyDir('./node_modules/sword/src', './playground/sword')
])
