import { CirqlOptions, CountQueryOptions, CreateQueryOptions, DeleteQueryOptions, RelateQueryOptions, SelectQueryOptions, SimpleQueryOptions, UpdateQueryOptions } from "./types";
import { SurrealHandle } from "../connection/types";
import { openConnection } from "../connection";
import { CirqlQuery } from "./query";
import { ZodTypeAny } from 'zod';

/**
 * A Cirql instance which will automatically connect to the Surreal database
 */
export class Cirql extends EventTarget {

	readonly options: CirqlOptions;
	
	#surreal: SurrealHandle|null = null;
	#isPending: boolean = false;
	#isConnected: boolean = false;

	constructor(options: CirqlOptions) {
		super();

		this.options = options;
		
		if (options.autoConnect !== false) {
			this.connect();
		}
	}

	/**
	 * Returns whether the database is connected or not
	 */
	get isConnected() {
		return this.#isConnected && !this.#isPending;
	}

	/**
	 * Manually open a connection to the Surreal database
	 */
	connect() {
		if (this.#isConnected || this.#isPending) {
			return;
		}

		this.#isPending = true;
		this.#surreal = openConnection({
			connection: this.options.connection,
			onConnect: () => {
				this.#isConnected = true;
				this.#isPending = false;
				this.dispatchEvent(new Event('open'));
			},
			onDisconnect: () => {
				this.#isConnected = false;
				this.#isPending = false;
				this.dispatchEvent(new Event('close'));
			},
			onError: (error) => {
				this.dispatchEvent(new CustomEvent('error', {
					detail: error
				}));
			}
		});
	}

	/**
	 * Terminate the active connection
	 */
	disconnect() {
		if (!this.#isConnected) {
			return;
		}

		this.#surreal?.close();
	}
	
	/**
	 * Start a new query and execute a raw query with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	query<R extends ZodTypeAny>(options: SimpleQueryOptions<R>) {
		return this.#init().query(options);
	}

	/**
	 * Start a new query and select multiple records with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	selectMany<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.#init().selectMany(options);
	}

	/**
	 * Start a new query and aelect a single record with support for parameters
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	selectOne<R extends ZodTypeAny>(options: SelectQueryOptions<R>) {
		return this.#init().selectOne(options);
	}

	/**
	 * Start a new query and create a new record from the given data. You can
	 * use the raw() function to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	create<R extends ZodTypeAny>(options: CreateQueryOptions<R>) {
		return this.#init().create(options);
	}

	/**
	 * Start a new query and update one or more records with the given data. You
	 * can use the raw() function to insert a raw value into the query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	update<R extends ZodTypeAny>(options: UpdateQueryOptions<R>) {
		return this.#init().update(options);
	}

	/**
	 * Start a new query and remove a single record by its unique ID
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	delete(options: DeleteQueryOptions) {
		return this.#init().delete(options);
	}

	/**
	 * Start a new query and return the amount of records that match the given
	 * query.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	count(options: CountQueryOptions) {
		return this.#init().count(options);
	}
	
	/**
	 * Start a new query and relate a record to another record over an edge.
	 * 
	 * @param options The query options
	 * @returns Cirql query builder
	 */
	relate(options: RelateQueryOptions) {
		return this.#init().relate(options);
	}

	#init() {
		return new CirqlQuery(this, [], {}, [] as const);
	}

}