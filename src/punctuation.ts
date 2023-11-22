enum PuncPosition {
    BEGIN = 0,
    END = 1,
    MIDDLE = 2,
    ALONE = 3
}

interface PuncIndex {
    punc: string;
    position: PuncPosition;
}

class Punctuation {
    private _puncs: string;
    private puncsRegularExp: RegExp;
    private static readonly _DEF_PUNCS: string = ';:,.!?¡¿—…"«»“”';

    constructor(puncs: string = Punctuation._DEF_PUNCS) {
        this._puncs = puncs;
        this.puncsRegularExp = new RegExp(`(\\s*[${this.escapeRegExp(this._puncs)}]+\\s*)+`, 'g');
    }

    get puncs(): string {
        return this._puncs;
    }

    set puncs(value: string) {
        if (typeof value !== 'string') {
            throw new Error("Punctuations must be of type string.");
        }
        this._puncs = Array.from(new Set(value.split(''))).join('');
        this.puncsRegularExp = new RegExp(`(\\s*[${this.escapeRegExp(this._puncs)}]+\\s*)+`, 'g');
    }

    private escapeRegExp(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    strip(text: string): string {
        return text.replace(this.puncsRegularExp, ' ').trim();
    }

    strip_to_restore(text: string): [string[], PuncIndex[]] {
        return this._strip_to_restore(text);
    }

    private _strip_to_restore(text: string): [string[], PuncIndex[]] {
        const matches = Array.from(text.matchAll(this.puncsRegularExp));
        if (matches.length === 0) {
            return [[text], []];
        }

        if (matches.length === 1 && matches[0][0] === text) {
            return [[], [{ punc: text, position: PuncPosition.ALONE }]];
        }

        let puncs: PuncIndex[] = [];
        let splitText: string[] = [];
        let lastIndex = 0;

        matches.forEach((match, index) => {
            const position = 
                index === 0 && text.startsWith(match[0]) ? PuncPosition.BEGIN :
                index === matches.length - 1 && text.endsWith(match[0]) ? PuncPosition.END :
                PuncPosition.MIDDLE;

            splitText.push(text.substring(lastIndex, match.index));
            puncs.push({ punc: match[0], position });
            lastIndex = match.index! + match[0].length;
        });

        if (lastIndex < text.length) {
            splitText.push(text.substring(lastIndex));
        }

        return [splitText, puncs];
    }

    static restore(text: string[], puncs: PuncIndex[]): string {
        return this._restore(text, puncs, 0);
    }

    private static _restore(text: string[], puncs: PuncIndex[], num: number): string {
        if (puncs.length === 0) {
            return text.join('');
        }

        const current = puncs[0];

        switch (current.position) {
            case PuncPosition.BEGIN:
                return this._restore([current.punc + text[0], ...text.slice(1)], puncs.slice(1), num);
            case PuncPosition.END:
                return text[0] + current.punc + this._restore(text.slice(1), puncs.slice(1), num + 1);
            case PuncPosition.ALONE:
                return current.punc + this._restore(text, puncs.slice(1), num + 1);
            case PuncPosition.MIDDLE:
                if (text.length === 1) {
                    return this._restore([text[0] + current.punc], puncs.slice(1), num);
                }
                return this._restore([text[0] + current.punc + text[1], ...text.slice(2)], puncs.slice(1), num);
        }
    }
}

export { Punctuation }