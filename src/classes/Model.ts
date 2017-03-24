import { Column } from './Column';
import { Index } from './Index';
import { StringUtil } from './StringUtil';
import { Query } from './Query';

const q = Symbol();

export class Model {
    static INDEXES: Index[] = [];
    static COLUMNS: { [index: string]: Column } = {};
    static TABLE_NAME;
    static PRIMARY_COLUMN: Column;

    constructor(query: Query) {
        this[q] = query;
    }

    save() {
        if (this[(this.constructor as typeof Model).PRIMARY_COLUMN.property]) {

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