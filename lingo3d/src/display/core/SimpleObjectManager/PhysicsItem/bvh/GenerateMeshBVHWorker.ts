import { Box3, BufferAttribute, BufferGeometry } from 'three'
import { MeshBVH } from "./bvh"
import "./generateAsync.worker.js"

export class GenerateMeshBVHWorker {

	private running = false
	private worker = new Worker( new URL( "./generateAsync.worker.js", import.meta.url ), { type: 'module' } )

	generate( geometry: BufferGeometry, options: { onProgress?: (v: number) => void } = {} ): Promise<MeshBVH> {

		if ( this.running ) {

			throw new Error( 'GenerateMeshBVHWorker: Already running job.' )

		}

		const { worker } = this
		this.running = true

		return new Promise( ( resolve, reject ) => {

			worker.onmessage = e => {

				this.running = false
				const { data } = e

				if ( data.error ) {

					reject( new Error( data.error ) )
					worker.onmessage = null

				} else if ( data.serialized ) {

					const { serialized, position } = data
					const bvh = MeshBVH.deserialize( serialized, geometry, { setIndex: false } )
					const boundsOptions = Object.assign( {

						setBoundingBox: true,

					}, options )

					// we need to replace the arrays because they're neutered entirely by the
					// webworker transfer.
					//@ts-ignore
					geometry.attributes.position.array = position
					if ( geometry.index ) {

						geometry.index.array = serialized.index

					} else {

						const newIndex = new BufferAttribute( serialized.index, 1, false )
						geometry.setIndex( newIndex )

					}

					if ( boundsOptions.setBoundingBox ) {

						geometry.boundingBox = bvh.getBoundingBox( new Box3() )

					}

					resolve( bvh )
					worker.onmessage = null

				} else if ( options.onProgress ) {

					options.onProgress( data.progress )

				}

			}

			const index = geometry.index ? geometry.index.array : null
			const position = geometry.attributes.position.array

			//@ts-ignore
			if ( position.isInterleavedBufferAttribute || index && index.isInterleavedBufferAttribute ) {

				throw new Error( 'GenerateMeshBVHWorker: InterleavedBufferAttribute are not supported for the geometry attributes.' )

			}

			const transferrables = [ position ]
			if ( index ) {

				transferrables.push( index )

			}

			worker.postMessage( {

				index,
				position,
				options: {
					...options,
					onProgress: null,
					includedProgressCallback: Boolean( options.onProgress ),
					groups: [ ... geometry.groups ],
				},

				//@ts-ignore
			}, transferrables.map( arr => arr.buffer ) )

		} )

	}

	dispose() {

		this.worker.terminate()

	}

	terminate() {

		console.warn( 'GenerateMeshBVHWorker: "terminate" is deprecated. Use "dispose" instead.' )
		this.dispose()

	}

}