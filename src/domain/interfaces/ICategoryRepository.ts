import { ICategory } from "../../models/Categories";

export default interface ICategoryRepository {

    findAll(storeCode: string, id?: string, nome?: string) : Promise<Array<ICategory>>

    findOne(id: string) : Promise<ICategory>

    add(category: ICategory) : Promise<ICategory>

    deleteOne(id: string) : Promise<ICategory>

    update(id: string, data: Partial<{
        nome: string,
        image: string
      }>
    ) : Promise<ICategory>

    updateOrdenation(storeCode: string, data: Array<{
        id?: string,
        ordenacao?: number
    }>) : Promise<void>

    getMenuItems(storeCode: string) : Promise<ICategory[]>;
}