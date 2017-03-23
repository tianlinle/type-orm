import { Model } from './Model';
import { Connection } from './Connection';
import * as mysql from 'mysql2';
import { Literal } from './Literal';

export class Query {
    modelClass: typeof Model;
    connection: Connection;
    whereClause: string;

    constructor(connection: Connection, modelClass: typeof Model) {
        modelClass.init();
        this.connection = connection;
        this.modelClass = modelClass;
    }

    where(condiction, ...others) {
        if (!this.whereClause) {
            this.whereClause = 'WHERE ';
        }
        this.whereClause += [].slice.call(arguments).join(' AND ');
        return this;
    }

    find() {

    }

    fetch() {

    }

    static orX(condiction0, condiction1, ...others) {
        return [].slice.call(arguments).join(' OR ');
    }

    static andX(condiction0, condiction1, ...others) {
        return [].slice.call(arguments).join(' AND ');
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