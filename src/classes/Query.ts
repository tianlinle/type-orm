import { Model } from './Model';
import { Connection } from './Connection';
import * as mysql from 'mysql2';
import { Literal } from './Literal';
import { Column } from './Column';
import { Result } from './Result';
import { ColumnValue } from './ColumnValue';
import { Aggregation } from './Aggregation';

type ResultSetHeader = { fieldCount: number, affectedRows: number, insertId: number, info: string, serverStatus: number, warningStatus: 0, changedRows: 0 };
type UpdateResult = { affectedRows: number, changedRows: number };

export class Query<T extends Model> {
    connection: Connection;
    protected whereClause: string = '';
    protected orderList: string[] = [];
    protected limitOffset: string;
    protected groupByParts: string[] = [];
    protected having: string;

    constructor(connection: Connection, public modelClass: { new (query): T } & typeof Model) {
        modelClass.init();
        this.connection = connection;
        this.modelClass = modelClass;
    }

    orderBy(column: Column, operator?: 'DESC' | 'ASC') {
        this.orderList.push(Query.quoteId(column.name) + (operator ? ' ' + operator : ''));
        return this;
    }

    limit(length, offset: number = 0) {
        this.limitOffset = offset === undefined ? length : offset + ', ' + length;
        return this;
    }

    where(condictions: string[] | string) {
        if (this.whereClause) {
            this.whereClause += ' AND ';
        }
        this.whereClause += typeof condictions == 'string' ? condictions : condictions.join(' AND ');
        return this;
    }

    groupBy(columns: (Column | string)[], having?: string) {
        let clmns: Array<Column | string> = columns instanceof Array ? columns : [columns];
        for (let clmn of clmns) {
            if (clmn instanceof Column) {
                this.groupByParts.push(Query.quoteId(clmn.name));
            } else {
                this.groupByParts.push(Query.quoteId(this.modelClass.columnName(clmn)));
            }
        }
        if (having) {
            this.having = having;
        }
    }

    async update(pairs: ColumnValue[] | { [index: string]: any }): Promise<UpdateResult> {
        let parts: string[] = [];
        if (pairs instanceof Array) {
            for (let p of pairs) {
                parts.push(Query.quoteId(p.columnName) + ' = ' + Query.quoteValue(p.value));
            }
        } else {
            for (let index in pairs) {
                parts.push(Query.quoteId(index) + ' = ' + Query.quoteValue(pairs[index]));
            }
        }
        if (parts.length > 0) {
            let sql = 'UPDATE ' + this.modelClass.TABLE_NAME + ' SET ' + parts.join(', ');
            if (this.whereClause) {
                sql += ' WHERE ' + this.whereClause;
            }
            let [header] = await this.connection.execute(sql);
            return { affectedRows: (header as ResultSetHeader).affectedRows, changedRows: (header as ResultSetHeader).changedRows };
        }
        return { affectedRows: 0, changedRows: 0 };
    }

    async insert(pairs: ColumnValue[] | { [index: string]: any }) {
        let result = await this.insertMulti([pairs]);
        return result.insertId;
    }

    async insertMulti(models: Model[]) {
        let columnNames: string[] = [];
        let valuesArr: string[] = [];
        let isFirstLoop = true;
        for (let model of models) {
            let values = [];
            for (let i in this.modelClass.COLUMNS) {
                let column = this.modelClass.COLUMNS[i];
                if (model[column.property] !== undefined) {
                    values.push(Query.quoteValue(model[column.property]));
                    if (isFirstLoop) {
                        columnNames.push(Query.quoteId(column.name));
                    }
                }
            }
            isFirstLoop = false;
            valuesArr.push(values.join(', '));
        }
        let [result] = await this.connection.execute(`INSERT INTO ${Query.quoteId(this.modelClass)} (${columnNames.join(', ')}) VALUES (${valuesArr.join('), (')})`);
        let insertId = (<ResultSetHeader>result).insertId;

    }

    async insertMulti2(pairsArr: ColumnValue[][] | { [index: string]: any }[]) {
        let columnNames: string[] = [];
        let valuesArr: string[] = [];
        let isFirstLoop = true;;
        for (let pairs of pairsArr) {
            let values = [];
            if (pairs instanceof Array) {
                for (let i in pairs) {
                    isFirstLoop ? columnNames.push(Query.quoteId(pairs[i].columnName)) : undefined;
                    values.push(Query.quoteValue(pairs[i].value));
                }
            } else {
                for (let i in pairs) {
                    isFirstLoop ? columnNames.push(Query.quoteId(this.modelClass.columnName(i))) : undefined;
                    values.push(Query.quoteValue(pairs[i]));
                }
            }
            isFirstLoop = false;
            valuesArr.push(values.join(', '));
        }
        let [result] = await this.connection.execute(`INSERT INTO ${Query.quoteId(this.modelClass)} (${columnNames.join(', ')}) VALUES (${valuesArr.join('), (')})`);
        return {
            insertId: (<ResultSetHeader>result).insertId,
            affectedRows: (<ResultSetHeader>result).affectedRows,
        }
    }

    async count() {
        let agg = new Aggregation(this);
        let rows = await this.select(agg.count('*', 'countAll'));
        return rows[0]['countAll'];
    }

    async select(columns: (Column | string | Literal)[]) {
        let selectParts = [];
        for (let column of columns) {
            selectParts.push(Query.quoteId(column));
        }
        let sql: string = 'SELECT ' + selectParts.join(', ') + ' FROM ' + Query.quoteId(this.modelClass.TABLE_NAME);
        if (this.whereClause) {
            sql += ' WHERE ' + this.whereClause;
        }
        if (this.groupByParts.length > 0) {
            sql += ' GROUP BY ' + this.groupByParts.join(', ');
            if (this.having) {
                sql += ' HAVING ' + this.having;
            }
        }
        if (this.orderList.length > 0) {
            sql += ' ORDER BY ' + this.orderList.join(', ');
        }
        if (this.limitOffset) {
            sql += ' LIMIT ' + this.limitOffset;
        }
        let [rows, fields] = await this.connection.execute(sql);
        return rows;
    }

    async find() {
        let rows = await this.select([new Literal('*')]);
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

    static quoteId(column: string | Column | typeof Model | Literal) {
        let columnName: string;
        if (typeof column == 'string') {
            columnName = column;
        } else if (column instanceof Column) {
            columnName = column.name;
        } else if (column instanceof Literal) {
            columnName = column.value;
        } else {
            columnName = column.TABLE_NAME;
        }
        return mysql.escapeId(columnName);
    }

    static quoteValue(value) {
        if (value instanceof Literal) {
            return value.value;
        }
        return mysql.escape(value);
    }
}

class TestModel extends Model { }

let q = new Query(null, TestModel);