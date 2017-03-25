import { Literal } from './Literal';
import { Query } from './Query';

export class Column {
    property: string;
    name: string;
    type: string;
    null: boolean;
    default: any;
    extra: Literal;
    comment: string;

    value(v) {
        return Query.quoteColumn(this.name) + ' = ' + Query.quoteValue(v);
    }

    eq(value) {
        if (value === null) {
            return Query.quoteColumn(this.name) + ' IS NULL';
        } else {
            return Query.quoteColumn(this.name) + ' = ' + Query.quoteValue(value);
        }
    }

    neq(value) {
        if (value === null) {
            return Query.quoteColumn(this.name) + ' IS NOT NULL';
        } else {
            return Query.quoteColumn(this.name) + ' <> ' + Query.quoteValue(value);
        }
    }

    gt(value) {
        return Query.quoteColumn(this.name) + ' > ' + Query.quoteValue(value);
    }

    gte(value) {
        return Query.quoteColumn(this.name) + ' >= ' + Query.quoteValue(value);
    }

    lt(value) {
        return Query.quoteColumn(this.name) + ' < ' + Query.quoteValue(value);
    }

    lte(value) {
        return Query.quoteColumn(this.name) + ' <= ' + Query.quoteValue(value);
    }

    in(values: Literal | any[]) {
        if (values instanceof Literal) {
            return Query.quoteColumn(this.name) + ' IN (' + Query.quoteValue(values) + ')';
        }
        let valueParts: string[] = [];
        for (let item of values) {
            valueParts.push(Query.quoteValue(item));
        }
        if (valueParts.length == 0) {
            return '1 > 0';
        }
        return Query.quoteColumn(this.name) + ' IN (' + valueParts.join(', ') + ')';
    }

    nin(values: Literal | any[]) {
        if (values instanceof Literal) {
            return Query.quoteColumn(this.name) + ' IN (' + Query.quoteValue(values) + ')';
        }
        let valueParts: string[] = [];
        for (let item of values) {
            valueParts.push(Query.quoteValue(item));
        }
        if (valueParts.length == 0) {
            return '1 = 1';
        }
        return Query.quoteColumn(this.name) + ' NOT IN (' + valueParts.join(', ') + ')';
    }

    like(value, part: 'GENERAL' | 'LEFT' | 'RIGHT' | 'NONE' = 'GENERAL') {
        if (value instanceof Literal) {
            return Query.quoteColumn(this.name) + ' LIKE ' + Query.quoteValue(value);
        }
        switch (part) {
            case 'GENERAL':
                value = '%' + value + '%';
                break;
            case 'LEFT':
                value = value + '%';
                break;
            case 'RIGHT':
                value = '%' + value;
                break;
            default:
                break;
        }
        return Query.quoteColumn(this.name) + ' LIKE ' + Query.quoteValue(value);
    }

    static initiate(type: string, option?: { null?: boolean, default?: any, extra?: Literal, comment?: string }) {
        let column = new Column();
        let defaultOption = { null: true, default: null };
        option = Object.assign(defaultOption, option);
        column.type = type;
        column.null = option.null;
        column.default = option.default;
        column.extra = option.extra === undefined ? new Literal('') : option.extra;
        column.comment = option.comment ? option.comment : '';
        return column;
    }

    static increment() {
        return this.initiate('int(11)', { null: false, extra: new Literal('auto_increment') });
    }

    static char(option?: { length?: number, null?: boolean, default?: any, comment?: string }) {
        return this.initiate('char' + (option && option.length ? '(' + option.length + ')' : ''), option);
    }

    static varchar(option?: { length?: number, null?: boolean, default?: any, comment?: string }) {
        return this.initiate('varchar' + (option && option.length ? '(' + option.length + ')' : ''), option);
    }

    static int(option?: { null?: boolean, default?: any, comment?: string }) {
        return this.initiate('int(11)', option);
    }

    static text(option?: { null?: boolean, comment?: string }) {
        return this.initiate('text', option);
    }

    static timestamp(option?: { null?: boolean, default?: any, extra?: Literal, comment?: string }) {
        return this.initiate('timestamp', option);
    }

    static created() {
        return Column.timestamp({ null: true, default: new Literal('CURRENT_TIMESTAMP') });
    }

    static updated() {
        return Column.timestamp({ null: true, default: new Literal('CURRENT_TIMESTAMP'), extra: new Literal('on update CURRENT_TIMESTAMP') });
    }
}