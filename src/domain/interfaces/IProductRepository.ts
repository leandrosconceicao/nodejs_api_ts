import { IOrderProduct } from "../../models/Orders";
import { IProduct, IProductImages, ProductFilters } from "../types/IProduct";

export interface IProductRepository {
    
    findAll(query: ProductFilters) : Promise<IProduct[]>;

    findOne(id: string) : Promise<IProduct>;
    
    findByCompanyFilter(storeCode: string, id: string) : Promise<IProduct>;

    add(data: IProduct) : Promise<IProduct>;

    delete(id: string) : Promise<void>;

    update(id: string, data: Partial<IProduct>) : Promise<IProduct>;

    validateProducts(storeCode: string, products: IOrderProduct[]) : Promise<void>;

    addImage(storeCode: string, productId: string, file: IProductImages) : Promise<IProduct>;

    setProductThumbnail(storeCode: string, productId: string, file: IProductImages) : Promise<IProduct>;

    removeImage(storeCode: string, productId: string, file: IProductImages) : Promise<IProduct>;    
}