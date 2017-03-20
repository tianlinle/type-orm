import * as mysql from 'mysql2/promise';
import { Model } from './Model';
import { Query } from './Query';

export class Connection {
    connectionConfig;
    connection;

    constructor(config) {
        this.connectionConfig = config;
    }

    async connect() {
        if (!this.connection) {
            this.connection = await mysql.createConnection(this.connectionConfig);
        }
    }

    query(modelClass: typeof Model): Query {
        return new Query(this, modelClass);
    }

    async execute(sql: string, params?) {
        await this.connect();
        console.log(sql);
        let result = await this.connection.execute(sql, params);
        return result;
    }
}