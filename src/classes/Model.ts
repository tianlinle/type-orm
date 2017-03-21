import { Column } from './Column';
import { Index } from './Index';
import { StringUtil } from './StringUtil';

export class Model {
    static INDEXES: Index[] = [];
    static COLUMNS: { [index: string]: Column } = {};
    static TABLE_NAME;

    static init() {
        if (!this.TABLE_NAME) {
            this.TABLE_NAME = 'tb_' + StringUtil.underscore(this.name.slice(0, -5));
            for (let i in this.COLUMNS) {
                this.columnName(i, this.COLUMNS[i]);
            }
            for (let index of this.INDEXES) {
                this.indexName(index);
            }
        }
    }

    static columnName(field: string, column: Column) {
        column.name = field.toLowerCase();
    }

    static indexName(index: Index) {
        if (index.type == 'PRIMARY') {
            index.name = 'PRIMARY';
        } else {
            let nameParts: string[] = [];
            for (let column of index.columns) {
                nameParts.push(column.name);
            }
            if (index.type == 'UNIQUE') {
                index.name = 'uni_' + nameParts.join('_');
            } else {
                index.name = 'idx_' + nameParts.join('_');
            }
        }
    }
}