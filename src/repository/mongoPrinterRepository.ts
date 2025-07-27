import { delay, injectable, registry } from "tsyringe";
import IPrinterRepository from "../domain/interfaces/IPrinterRepository";
import { IPrinters } from "../domain/types/IPrinters";
import Printers from "../models/Printers";
import mongoose from "mongoose";
import { SpoolType } from "../domain/types/IPrinterSpool";
import BadRequestError from "../models/errors/BadRequest";
import NotFoundError from "../models/errors/NotFound";

var ObjectId = mongoose.Types.ObjectId;

@injectable()
@registry([
    {
        token: "IPrinterRepository",
        useToken: delay(() => MongoPrinterRepository)
    }
])

export default class MongoPrinterRepository implements IPrinterRepository {

    async update(address: string, data: Partial<IPrinters>): Promise<void> {
        const printer = await Printers.findOne({
            address: address
        })
        
        if (!printer) {
            throw new NotFoundError("Impressora não localizada")
        }

        Object.values(SpoolType).forEach((e) => {
            const values = data.spools.filter((s) => s.type == e);

            if (values.length > 1)
                throw new BadRequestError("")
        })
        
        await Printers.findOneAndUpdate({
            address: address,
        }, data)
    } 
    
    async findAll(storeCode: string, type?: SpoolType): Promise<IPrinters[]> {
        let filters : {
            deleted: boolean,
            storeCode: any,
            spools?: any
        } = {
            deleted: false,
            storeCode: new ObjectId(storeCode),            
        }
        if (type) {
            filters.spools = {
                $elemMatch: {
                    type: type,
                    enabled: true
                }
            }
        }
        return await Printers.find(filters)
    }

    async findOne(id: string): Promise<IPrinters> {
        const printer = await Printers.findById(id);

        if (!printer)
            throw new NotFoundError("Impressora não localizada");

        return printer;
    }

    async create(printer: IPrinters): Promise<IPrinters> {
        const data = await Printers.findOne({
            address: printer.address,
            deleted: false,
            storeCode: new ObjectId(printer.storeCode.toString())
        })

        if (data) {
            throw new BadRequestError(`Impressora já cadastrada`)
        }
        return await Printers.create(printer);
    }
    
    async delete(id: string): Promise<void> {
        
        await this.findOne(id);

        await Printers.findByIdAndUpdate(id, {
            deleted: true
        })
    }

}