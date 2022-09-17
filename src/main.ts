import init, { greet, main } from '../pkg/lib_ai.js'

window.log = (...args) => console.log(args)

await init()

greet('WebAssembly')

main()
