import { IProduct, IProductImages, ProductFilters } from "../types/IProduct";
import { IFile } from "./IFile";

export interface IProductHandler {

    findAll(query: ProductFilters) : Promise<IProduct[]>;
    
    findOne(id: string) : Promise<IProduct>;
    
    findByCompanyFilter(storeCode: string, id: string) : Promise<IProduct>;

    addProductImage(storeCode: string, productId: string, file: IFile) : Promise<string>;

    deleteProductImage(storeCode: string, productId: string, file: {filename: string, link: string}) : Promise<void>;

    setThumbnail(storeCode: string, productId: string, image: IProductImages) : Promise<void>

    createProduct(body: any) : Promise<IProduct>;

    deleteProduct(storeCode: string, id: string) : Promise<void>;
    
}