
export class SelectorUtils {
    static fromId(id) {
        return `[id=${id}]`;
    }

    static fromDataId(id) {
        return `[data-id=${id}]`;
    }
}

export class TestUtils {
    static isHeadless() {
        return process.env.HEADLESS !== 'false';
    }
}
