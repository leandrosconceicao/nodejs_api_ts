import TokenGenerator from "../../utils/tokenGenerator";
import { idValidation } from "../../utils/defaultValidations";
import mongoose from "mongoose"
import { z } from "zod";

enum AddOneType {
    checkbox = "checkbox",
    range = "range"
}

interface IProductAddOne {
    _id: string,
    isRequired: boolean,
    name: string,
    type: AddOneType,
    maxQtdAllowed: number,
    items: Array<{
        name: string,
        price: number
    }>
}

const addOneValidation = z.object({
    _id: z.string().min(1).uuid().optional(),
    storeCode: idValidation,
    name: z.string(),
    type: z.nativeEnum(AddOneType).default(AddOneType.checkbox),
    maxQtdAllowed: z.number().optional(),
    items: z.array(z.object({
        name: z.string().min(1),
        price: z.number().default(0.0)
    })).nonempty({ message: "Ao menos 1 item deve ser adicionado" })
}).transform((value) => {
    value._id = TokenGenerator.generateId();
    return value;
});

const schema = new mongoose.Schema({
    _id: { type: String },
    storeCode: { type: mongoose.Types.ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"] },
    name: { type: String },
    maxQtdAllowed: { type: Number },
    type: {
        type: String,
        default: "checkbox",
        enum: {
            values: ["checkbox", "range"],
            message: "O tipo {VALUE} não é um valor permitido"
        }
    },
    items: {
        type: [
            {
                name: String,
                price: Number,
            },
        ],
        default: undefined,
    },
}, {
    timestamps: true
});

schema.index({
    _id: 1,
    storeCode: 1,
}, {
    unique: true
})


const AddOnes = mongoose.model<IProductAddOne>("addOnes", schema);


export { addOneValidation, AddOnes, AddOneType, IProductAddOne }