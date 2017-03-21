export class StringUtil {
    static camelize(str: string) {
        return str.replace(/^([A-Z])|[\s-_](\w)/g, function (match, p1, p2, offset) {
            if (p2) return p2.toUpperCase();
            return p1.toLowerCase();
        });
    }

    static underscore(str: string) {
        return str.replace(/(?:^|\.?)([A-Z])/g, (x, y) => "_" + y.toLowerCase()).replace(/^_/, "");
    }
}