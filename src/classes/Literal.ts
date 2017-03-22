export class Literal {
    value;

    constructor(value) {
        this.value = value;
    }

    static isEqual(a: any, b: any) {
        let va = a instanceof Literal ? a.value : a;
        let vb = b instanceof Literal ? b.value : b;
        return va == vb;
    }
}