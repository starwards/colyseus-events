export class SymbolWeakSet {
    private _flag = Symbol('SymbolWeakSet');

    add(obj: object) {
        if (!this.has(obj)) {
            //@ts-ignore: the flag symbol is not part of T
            obj[this._flag] = true;
        }
    }

    has(obj: object): boolean {
        //@ts-ignore: the flag symbol is not part of T
        return !!obj[this._flag];
    }
}
