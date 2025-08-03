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
        if (!this.filters.offset) {
            return {
                offset: 0,
                limit: Infinity
            }
        }
        let page = parseInt(this.filters.offset as string) || 0;
        let limit = parseInt(this.filters.limit as string) || 100;
        return {
            offset: page * limit,
            limit: limit
        }
    }
}