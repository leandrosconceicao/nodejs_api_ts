interface OrderBy {
    orderBy: string,
    ordenation: number,
}
interface Pagination {
    offset: number,
    limit: number
}
interface headersParameters {
    limit?: string | string[];
    offset?: string | string[];
    orderby?: string | string[];
    ordenation?: string | string[];
}
export default class Headers {
    // headers: any;
    filters: headersParameters;
    constructor(filters: headersParameters) {
        this.filters = filters;
    }

    getOrderBy(): OrderBy {
        const ordenation = parseInt(this.filters.ordenation as string);
        return {
            orderBy: this.filters.orderby as string,
            ordenation: isNaN(ordenation) ? 1 : ordenation,
        }
    }

    getPagination(): Pagination {
        let limit = parseInt(this.filters.limit as string);
        let page = parseInt(this.filters.offset as string);
        let config = (page - 1) * limit;
        return {
            offset: config >= 0 ? page : 0,
            limit: limit > 0 ? limit : Infinity
        }
    }
}