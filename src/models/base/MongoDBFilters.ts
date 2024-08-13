interface ElementMatch {
    $elemMatch: any
}

class ArraySearch {

    query: any;

    constructor(query: any) {
        this.query = query;
    }

    build() : ElementMatch {
        return {
            $elemMatch: this.query
        }
    }
}

export {ElementMatch, ArraySearch};