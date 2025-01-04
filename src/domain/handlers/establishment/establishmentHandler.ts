import NotFoundError from "../../../models/errors/NotFound";
import { Establishments } from "../../../models/Establishments"
import BadRequestError from "../../../models/errors/BadRequest";

export default class EstablishmentHandler  {
    
    static async validateDiscount(storeCode: string, discount?: number) : Promise<void> {

        if (!discount) return;

        const store = await Establishments.findById(storeCode);

        if (!store)
            throw new NotFoundError("Loja não localizada")
        
        if (!store?.maxDiscountAllowed) return;

        if ( discount > store.maxDiscountAllowed)
            throw new BadRequestError(`Desconto solicitado é maior que o permitido.`)

    }
}