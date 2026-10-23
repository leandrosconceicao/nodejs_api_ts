import { ICategory } from "../../models/Categories";

export default interface ICategoryRepository {

    findAll(storeCode: string, id?: string, nome?: string) : Promise<Array<ICategory>>

    findOne(id: string) : Promise<ICategory | null>

    add(category: ICategory) : Promise<ICategory>

    deleteOne(id: string) : Promise<ICategory | null>

    update(id: string, data: Partial<{
        nome: string,
        image: string
      }>
    ) : Promise<ICategory | null>

    updateOrdenation(storeCode: string, data: Array<{
        id?: string,
        ordenacao?: number
    }>) : Promise<void>

    getMenuItems(storeCode: string, categoryId?: string) : Promise<ICategory[]>;
}