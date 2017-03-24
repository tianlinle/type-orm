import { Model } from './Model';
import { Connection } from './Connection';
import * as mysql from 'mysql2';
import { Literal } from './Literal';
import { Column } from './Column';
import { Result } from './Result';

type ResultSetHeader = { fieldCount: number, affectedRows: number, insertId: number, info: string, serverStatus: number, warningStatus: 0, changedRows: 0 };

export class Query {
    modelClass: typeof Model;
    connection: Connection;
    protected whereClause: string;
    protected orderList: string[] = [];
    protected limitOffset: string;

    constructor(connection: Connection, modelClass: typeof Model) {
        modelClass.init();
        this.connection = connection;
        this.modelClass = modelClass;
    }

    orderBy(column: Column, operator?: 'DESC' | 'ASC') {
        this.orderList.push(Query.quoteColumn(column.name) + (operator ? ' ' + operator : ''));
        return this;
    }

    limit(length, offset: number = 0) {
        this.limitOffset = offset === undefined ? length : offset + ', ' + length;
        return this;
    }

    where(condiction, ...others) {
        if (this.whereClause) {
            this.whereClause += ' AND ';
        }
        this.whereClause += [].slice.call(arguments).join(' AND ');
        return this;
    }

    async update(valueMap: { [index: string]: any }) {
        let parts: string[] = [];
        for (let property in valueMap) {
            parts.push(Query.quoteColumn(this.modelClass.columnName(property)) + ' = ' + Query.quoteValue(valueMap[property]));
        }
        if (parts.length > 0) {
            let sql = 'UPDATE ' + this.modelClass.TABLE_NAME + ' SET ' + parts.join(', ') + ' WHERE ' + this.whereClause;
            let [header] = await this.connection.execute(sql);
            header as ResultSetHeader;
        }
        return 0;
    }

    async count() {
        let sql: string = 'SELECT count(*)'
    }

    async find() {
        let modelClass = this.modelClass as typeof Model;
        let sql: string = 'SELECT * FROM ' + Query.quoteColumn(modelClass.TABLE_NAME);
        if (this.whereClause) {
            sql += ' WHERE ' + this.whereClause;
        }
        if (this.orderList) {
            sql += ' ORDER BY ' + this.orderList.join(', ');
        }
        if (this.limitOffset) {
            sql += ' LIMIT ' + this.limitOffset;
        }
        let [rows, fields] = await this.connection.execute(sql);
        let result = new Result();
        for (let i in rows) {
            let model = new this.modelClass(this);
            let row = rows[i];
            for (let columnName of row) {
                model[modelClass.propertyName(columnName)] = row[columnName];
            }
            result.push(row);
        }
        return result;
    }

    async fetch() {
        return (await this.find())[0];
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