interface DateQuery {
    $gte: Date,
    $lte: Date,
}

class PeriodQuery {
    from: string;
    to: string;
    constructor(from: string, to: string) {
        this.from = from;
        this.to = to
    }


    build() : DateQuery {
        return {
            $gte: new Date(this.from),
            $lte: new Date(this.to)
        }
    }
    
}

export {DateQuery , PeriodQuery}