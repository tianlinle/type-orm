import { Literal } from './Literal';

export class Column {
    type: string;
    null: boolean;
    default: any;
    extra: Literal;
    comment: string;

    static initiate(type: string, option?: { null?: boolean, default?: any, extra?: Literal, comment?: string }) {
        let column = new Column();
        column.type = type;
        column.null = option.null;
        column.default = option.default;
        column.extra = option.extra;
        column.comment = option.comment;
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

    static text(option?: { null?: boolean, default?: any, comment?: string }) {
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