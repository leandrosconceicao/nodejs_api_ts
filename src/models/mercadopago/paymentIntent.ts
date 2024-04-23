import {z} from "zod";

interface PaymentResult {
    id: string,
    device_id: string,
    amount: number,
    description: string,
    payment: {
        installments: number,
        type: string,
        installments_cost: string,
    },
    additional_info?: {
        external_reference: string,
        print_on_terminal: boolean
    }
};

const paymentInputRequest = z.object({
    amount: z.number(),
    payment: z.object({
        installments: z.number(),
        type: z.enum(["credit_card", "debit_card"]),
        installments_cost: z.string().default("buyer")
    })
})

export {PaymentResult, paymentInputRequest};