import { Column } from './Column';

type IndexType = 'PRIMARY' | 'UNIQUE' | 'INDEX';

export class Index {
    name: string;
    type: IndexType;
    columns: Column[] = [];

    static initiate(type: IndexType, columns: Column | Column[]) {
        let index = new Index();
        index.type = type;
        index.columns = columns instanceof Array ? columns : [columns];
        return index;
    }

    static index(columns: Column | Column[]) {
        return this.initiate('INDEX', columns);
    }

    static unique(columns: Column | Column[]) {
        return this.initiate('UNIQUE', columns);
    }

    static primary(column: Column) {
        return this.initiate('PRIMARY', column);
    }
}