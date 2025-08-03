interface ElementMatch {
    $elemMatch: any
}

const DELETED_SEARCH =  {
    $in: [false, null]
};
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

export {ElementMatch, ArraySearch, DELETED_SEARCH};