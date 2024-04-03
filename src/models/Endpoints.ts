export default class Endpoints {

    static home = '/';
    static products = '/products';
    static paymentForms = '/paymentForms';
    static product_images = `${this.products}/images`;
    static menu_items = `${this.products}/menu_items`;
    static add_ones = `${this.products}/add_ones`;
    static categories = '/categories';
    static orders = '/orders';
    static charges = "/charges";
    static payments = "/payments";
    static establishments = '/establishments';
    static users = '/users';
    static authentication = `${this.users}/authentication`;
    static clients = '/clients';
    static apps = '/apps';
    static redis = '/redis';
    static clientsValidation = `/validation`;
    static clients_update_password = '/clients/update_password';
    static clients_recover_password = '/clients/recover_password';
    static clients_forgot_password = '/clients_forgot_password';
    static events = '/events';
    static notifications = "/notifications";
    static queue = '/queue';
    static reports = '/reports';
    static quantSales = `${this.reports}/quantify_sales`;
    static quantSalesByProduct = `${this.reports}/quantify_sales_by_product`;
    static bakery = '/bakery';
    static bakery_ingredients = `${this.bakery}/ingredients`
    static bakery_recipes = `${this.bakery}/recipes`;
    static bakery_configs = `${this.bakery}/configs`;
    static bakery_expanses = `${this.bakery}/expanses`;
    static accounts = '/accounts';
}