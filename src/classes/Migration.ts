import { Model } from './Model';
import { Column } from './Column';
import { Query } from './Query';
import { Literal } from './Literal';
import { Index } from './Index';

type DescTableResult = { COLUMN_NAME: string, COLUMN_TYPE: string, IS_NULLABLE: string, COLUMN_DEFAULT: string, EXTRA: string, COLUMN_COMMENT: string };
type ShowIndexResult = { Column_name: string, Non_unique: '0' | '1', Key_name: string };

export class Migration {
    query: Query;

    constructor(query: Query) {
        this.query = query;
    }

    getDefinedColumns() {
        let columns = {};
        for (let i in this.query.modelClass) {
            if (this.query.modelClass[i] instanceof Column) {
                columns[i.toLowerCase()] = this.query.modelClass[i];
            }
        }
        return columns;
    }

    async getExistedIndexes() {
        let [indexResult] = await this.query.connection.execute('SHOW INDEX FROM ' + this.query.modelClass.TABLE_NAME);
        let existsIndexes: { [index: string]: Index } = {};
        for (let i in indexResult) {
            let row: ShowIndexResult = indexResult[i];
            if (!existsIndexes[row.Key_name]) {
                let index = new Index();
                index.name = row.Key_name;
                index.type = row.Key_name == 'PRIMARY' ? 'PRIMARY' : (row.Non_unique == '0' ? 'UNIQUE' : 'INDEX');
                index.columns.push();
                existsIndexes[row.Key_name] = index;
            }
            let index = new Index();
            index.name = row.Key_name;
        }
    }

    async getExistedColumns() {
        let [descTableResult] = await this.query.connection.execute('SELECT * FROM information_schema.columns WHERE table_schema=' + Query.quoteValue(this.query.connection.connectionConfig.database) + ' AND table_name=' + Query.quoteColumn(this.query.modelClass.TABLE_NAME));
        let existedColumns: { [index: string]: Column } = {};
        for (let i in descTableResult) {
            let row: DescTableResult = descTableResult[i];
            let column: Column = new Column();
            column.name = row.COLUMN_NAME;
            column.type = row.COLUMN_TYPE;
            column.null = row.IS_NULLABLE == 'YES';
            column.default = row.COLUMN_DEFAULT;
            column.extra = new Literal(row.EXTRA);
            column.comment = row.COLUMN_COMMENT;
            existedColumns[column.name] = column;
        }
        return existedColumns;
    }
}