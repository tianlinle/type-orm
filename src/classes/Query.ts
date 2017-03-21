import { Model } from './Model';
import { Connection } from './Connection';
import * as mysql from 'mysql2';
import { Literal } from './Literal';

export class Query {
    modelClass: typeof Model;
    connection: Connection;

    constructor(connection: Connection, modelClass: typeof Model) {
        modelClass.init();
        this.connection = connection;
        this.modelClass = modelClass;
    }

    static quoteColumn(columnName: string) {
        return mysql.escapeId(columnName);
    }

    static quoteValue(value) {
        if (value instanceof Literal) {
            return value.value;
        }
        if (value === null) {
            return 'NULL';
        }
        return mysql.escape(value);
    }
}