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

    async migrate() {
        let [descTableResults] = await this.query.connection.execute('SELECT * FROM information_schema.columns WHERE table_schema=' + Query.quoteValue(this.query.connection.connectionConfig.database) + ' AND table_name=' + Query.quoteColumn(this.query.modelClass.TABLE_NAME));

        if (descTableResults.length <= 0) {

        }

        let definedColumnMap: { [index: string]: Column } = {};
        let alterParts: string[] = [];
        for (let field in this.query.modelClass.COLUMNS) {
            let column = this.query.modelClass.COLUMNS[field];
            definedColumnMap[column.name] = column;
        }

        let existedColumnMap: { [index: string]: DescTableResult };
        for (let i in descTableResults) {
            let row: DescTableResult = descTableResults[i];
            existedColumnMap[row.COLUMN_NAME] = row;
            if (!this.query.modelClass.COLUMNS[row.COLUMN_NAME]) {
                alterParts.push('DROP COLUMN ' + Query.quoteColumn(row.COLUMN_NAME));
            }
        }

        for (let i in definedColumnMap) {
            let definedColumn = definedColumnMap[i];
            if (!existedColumnMap[definedColumn.name]) {
                alterParts.push('ADD COLUMN ' + Migration.getColumnStatement(definedColumn));
            } else {
                let existedColumn = existedColumnMap[definedColumn.name];
                if (existedColumn.COLUMN_TYPE != definedColumn.type ||
                    existedColumn.COLUMN_COMMENT != definedColumn.comment ||
                    !Literal.isEqual(existedColumn.COLUMN_DEFAULT, definedColumn.default) ||
                    !Literal.isEqual(existedColumn.EXTRA, definedColumn.extra) ||
                    (existedColumn.IS_NULLABLE == 'YES') != definedColumn.null) {
                    alterParts.push('CHANGE COLUMN ' + Query.quoteColumn(existedColumn.COLUMN_NAME) + ' ' + Migration.getColumnStatement(definedColumn));
                }
            }
        }
    }

    async create() {
        let columnParts: string[] = [];
        for (let i in this.query.modelClass.COLUMNS) {
            columnParts.push(Migration.getColumnStatement(this.query.modelClass.COLUMNS[i]));
        }
        for (let i in this.query.modelClass.INDEXES) {

        }
    }

    static getIndexStatement(index: Index) {
        let statement: string = '';

    }

    static getColumnStatement(column: Column) {
        let parts: string[] = [];
        parts.push(Query.quoteColumn(column.name));
        parts.push(column.type);
        parts.push(column.null ? 'NULL' : 'NOT NULL');
        if (column.default !== undefined) {
            parts.push('DEFAULT ' + Query.quoteValue(column.default));
        }
        if (column.extra) {
            parts.push(Query.quoteValue(column.extra));
        }
        if (column.comment) {
            parts.push('COMMENT ' + Query.quoteValue(column.comment));
        }
        return parts.join(' ');
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