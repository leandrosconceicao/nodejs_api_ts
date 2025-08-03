import { Category } from "../../../models/Categories";
import NotFoundError from "../../../models/errors/NotFound";

export default class ProductHandler {
    validateCategory = async (product: string) => {
        const category = await Category.findById(product).countDocuments()
        if (!category)
            throw new NotFoundError("Categoria informada não foi localizada");
    }
}