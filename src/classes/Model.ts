import { Column } from './Column';
import { Index } from './Index';
import { StringUtil } from './StringUtil';
import { Query } from './Query';
import { ColumnValue } from './ColumnValue';

const q = Symbol('query');
const r = Symbol('raw');

export class Model {
    static INDEXES: Index[] = [];
    static COLUMNS: { [index: string]: Column } = {};
    static TABLE_NAME;
    static PRIMARY_COLUMN: Column;

    constructor(query) {
        this[q] = query;
    }

    migrate(row) {
        let modelClass = this.constructor as typeof Model;
        this[r] = {};
        for (let columnName in row) {
            let propertyName = modelClass.propertyName(columnName);
            this[propertyName] = this[r][columnName] = row[columnName];
        }
    }

    async save() {
        let modelClass = this.constructor as typeof Model;
        if (this[modelClass.PRIMARY_COLUMN.property]) {
            let updated = [];
            for (let columnName in this[r]) {
                let propertyName = modelClass.propertyName(columnName);
                if (this[r][columnName] != this[propertyName] && this[propertyName] !== undefined) {
                    updated.push(new ColumnValue(columnName, this[propertyName]));
                    this[r][columnName] = this[propertyName];
                }
            }
            await this[q].connection.query(this.constructor as typeof Model).where(modelClass.PRIMARY_COLUMN.eq(this[modelClass.PRIMARY_COLUMN.property])).update(updated);
        } else {

        }
    }

    static init() {
        if (!this.TABLE_NAME) {
            this.TABLE_NAME = 'tb_' + StringUtil.underscore(this.name.slice(0, -5));
            for (let i in this.COLUMNS) {
                let column: Column = this.COLUMNS[i];
                column.name = this.columnName(i);
                column.property = this.propertyName(this.COLUMNS[i].name);
                if (typeof column.extra.value == 'string' && column.extra.value == 'auto_increment' && !this.PRIMARY_COLUMN) {
                    this.PRIMARY_COLUMN = column;
                }
            }
        }
    }

    static propertyName(columnName: string) {
        return StringUtil.camelize(columnName);
    }

    static columnName(field: string) {
        return field.toLowerCase();
    }
}