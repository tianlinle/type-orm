import { Model } from './Model';
import { Column } from './Column';
import { Query } from './Query';
import { Literal } from './Literal';
import { Index } from './Index';

type DescTableResult = { COLUMN_NAME: string, COLUMN_TYPE: string, IS_NULLABLE: string, COLUMN_DEFAULT: string, EXTRA: string, COLUMN_COMMENT: string };
type ShowIndexResult = { INDEX_NAME: string, KEY_NAME: string };

export class Migration {
    query: Query<Model>;

    constructor(query: Query<Model>) {
        this.query = query;
    }

    async migrate() {
        let sql: string = await this.showMigrate();
        if (sql != '') {
            await this.query.connection.execute(sql);
        }
    }

    async showMigrate(): Promise<string> {
        let [descTableResults] = await this.query.connection.execute('SELECT * FROM information_schema.columns WHERE table_schema=' + Query.quoteValue(this.query.connection.connectionConfig.database) + ' AND table_name=' + Query.quoteValue(this.query.modelClass.TABLE_NAME));
        let sql = '';
        if (descTableResults.length <= 0) {
            sql = await this.showCreateTable();
        } else {
            let definedColumnMap: { [index: string]: Column } = {};
            let alterParts: string[] = [];
            for (let field in this.query.modelClass.COLUMNS) {
                let column = this.query.modelClass.COLUMNS[field];
                definedColumnMap[column.name] = column;
            }

            let existedColumnMap: { [index: string]: DescTableResult } = {};
            for (let i in descTableResults) {
                let row: DescTableResult = descTableResults[i];
                existedColumnMap[row.COLUMN_NAME] = row;
                if (!definedColumnMap[row.COLUMN_NAME]) {
                    alterParts.push('DROP COLUMN ' + Query.quoteId(row.COLUMN_NAME));
                }
            }

            for (let i in definedColumnMap) {
                let definedColumn = definedColumnMap[i];
                if (!existedColumnMap[definedColumn.name]) {
                    alterParts.push('ADD COLUMN ' + Migration.getColumnStatement(definedColumn));
                } else {
                    let existedColumn = existedColumnMap[definedColumn.name];
                    let definedColumnDefault = definedColumn.default === undefined ? null : definedColumn.default;
                    if (existedColumn.COLUMN_TYPE != definedColumn.type ||
                        existedColumn.COLUMN_COMMENT != definedColumn.comment ||
                        !Literal.isEqual(existedColumn.COLUMN_DEFAULT, definedColumnDefault) ||
                        !Literal.isEqual(existedColumn.EXTRA, definedColumn.extra) ||
                        (existedColumn.IS_NULLABLE == 'YES') != definedColumn.null) {
                        alterParts.push('CHANGE COLUMN ' + Query.quoteId(existedColumn.COLUMN_NAME) + ' ' + Migration.getColumnStatement(definedColumn));
                    }
                }
            }

            let definedIndexNames = {};
            for (let index of this.query.modelClass.INDEXES) {
                let name: string = index.type == 'UNIQUE' ? '0' : '1';
                for (let column of index.columns) {
                    name += '_' + column.name;
                }
                definedIndexNames[name] = index;
            }

            let existedIndexNames = {};
            let existedPrimary: string;
            let [indexResults] = await this.query.connection.execute(`SELECT INDEX_NAME, concat(non_unique, '_', group_concat(column_name separator '_')) as KEY_NAME FROM information_schema.statistics where table_schema=${Query.quoteValue(this.query.connection.connectionConfig.database)} AND table_name=${Query.quoteValue(this.query.modelClass.TABLE_NAME)} group by index_name`);
            for (let i in indexResults) {
                let row: ShowIndexResult = indexResults[i];
                if (row.INDEX_NAME == 'PRIMARY') {
                    existedPrimary = row.KEY_NAME;
                } else {
                    existedIndexNames[row.KEY_NAME] = row.INDEX_NAME;
                }
            }

            if ('0_' + this.query.modelClass.PRIMARY_COLUMN.name != existedPrimary) {
                alterParts.push('DROP PRIMARY KEY');
                alterParts.push('ADD PRIMARY KEY (' + Query.quoteId(this.query.modelClass.PRIMARY_COLUMN.name) + ')');
            }

            for (let keyName in existedIndexNames) {
                if (!definedIndexNames[keyName]) {
                    alterParts.push('DROP INDEX ' + Query.quoteId(existedIndexNames[keyName]));
                }
            }

            for (let keyName in definedIndexNames) {
                if (!existedIndexNames[keyName]) {
                    let index: Index = definedIndexNames[keyName];
                    let indexType: string = index.type == 'UNIQUE' ? 'UNIQUE INDEX' : 'INDEX';
                    let columnParts: string[] = [];
                    for (let column of index.columns) {
                        columnParts.push(Query.quoteId(column.name));
                    }
                    alterParts.push('ADD ' + indexType + '(' + columnParts.join(', ') + ')');
                }
            }
            if (alterParts.length > 0) {
                sql = 'ALTER TABLE ' + this.query.modelClass.TABLE_NAME + ' ' + alterParts.join(', ');
            }
        }
        return sql;
    }

    /**
     * only support InnoDB for safe increment id
     */
    async showCreateTable() {
        let columnParts: string[] = [];
        for (let i in this.query.modelClass.COLUMNS) {
            columnParts.push(Migration.getColumnStatement(this.query.modelClass.COLUMNS[i]));
        }
        for (let i in this.query.modelClass.INDEXES) {
            columnParts.push(Migration.getIndexStatement(this.query.modelClass.INDEXES[i]));
        }
        columnParts.push('PRIMARY KEY (' + Query.quoteId(this.query.modelClass.PRIMARY_COLUMN.name) + ')');
        return 'CREATE TABLE ' + Query.quoteId(this.query.modelClass.TABLE_NAME) + '(' + columnParts.join(', ') + ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    }

    static getIndexStatement(index: Index) {
        let statement: string = '';
        let parts: string[] = [];
        for (let column of index.columns) {
            parts.push(Query.quoteId(column.name));
        }
        if (index.type == 'UNIQUE') {
            return 'UNIQUE INDEX (' + parts.join(', ') + ')';
        }
        return statement = 'INDEX (' + parts.join(', ') + ')';
    }

    static getColumnStatement(column: Column) {
        let parts: string[] = [];
        parts.push(Query.quoteId(column.name));
        parts.push(column.type);
        parts.push(column.null ? 'NULL' : 'NOT NULL');
        if (!(column.default === null && !column.null)) {
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
}