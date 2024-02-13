import mongoose from "mongoose";
import { DateQuery } from "../../utils/PeriodQuery";

interface QuerySearch {
    storeCode?: string
    createDate?: DateQuery,
    userCreate?: string | number | mongoose.mongo.BSON.ObjectId | mongoose.mongo.BSON.ObjectIdLike | Uint8Array,
    form?: string,
    status?: string,
}

export default abstract class ApiFilters {


    static filters() : QuerySearch {
        return {}
    }

}