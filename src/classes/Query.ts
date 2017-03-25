import { Model } from './Model';
import { Connection } from './Connection';
import * as mysql from 'mysql2';
import { Literal } from './Literal';
import { Column } from './Column';
import { Result } from './Result';
import { ColumnValue } from './ColumnValue';

type ResultSetHeader = { fieldCount: number, affectedRows: number, insertId: number, info: string, serverStatus: number, warningStatus: 0, changedRows: 0 };
type UpdateResult = { affectedRows: number, changedRows: number };

export class Query<T extends Model> {
    connection: Connection;
    protected whereClause: string = '';
    protected orderList: string[] = [];
    protected limitOffset: string;

    constructor(connection: Connection, public modelClass: { new (query): T } & typeof Model) {
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

    async update(pairs: ColumnValue[]): Promise<UpdateResult> {
        if (pairs.length > 0) {
            let parts: string[] = [];
            for (let p of pairs) {
                parts.push(Query.quoteColumn(p.columnName) + ' = ' + Query.quoteValue(p.value));
            }
            let sql = 'UPDATE ' + this.modelClass.TABLE_NAME + ' SET ' + parts.join(', ');
            if (this.whereClause) {
                sql += ' WHERE ' + this.whereClause;
            }
            let [header] = await this.connection.execute(sql);
            return { affectedRows: (header as ResultSetHeader).affectedRows, changedRows: (header as ResultSetHeader).changedRows };
        }
        return { affectedRows: 0, changedRows: 0 };
    }

    async count() {
        let sql: string = 'SELECT count(*)'
    }

    async find() {
        let modelClass = this.modelClass;
        let sql: string = 'SELECT * FROM ' + Query.quoteColumn(modelClass.TABLE_NAME);
        if (this.whereClause) {
            sql += ' WHERE ' + this.whereClause;
        }
        if (this.orderList.length > 0) {
            sql += ' ORDER BY ' + this.orderList.join(', ');
        }
        if (this.limitOffset) {
            sql += ' LIMIT ' + this.limitOffset;
        }
        let [rows, fields] = await this.connection.execute(sql);
        let result = new Result<T>();
        for (let i in rows) {
            let model = new this.modelClass(this);
            model.migrate(rows[i]);
            result.push(model);
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

class TestModel extends Model { }

let q = new Query(null, TestModel);