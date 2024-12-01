interface IPaymentsByMethods {
    _id: string,
    description: string,
    total: number,
    payments: Array<{
        _id: string,
        orderId?: string,
        total: number
    }>,
}

export {IPaymentsByMethods}