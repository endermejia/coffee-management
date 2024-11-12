"use server";

const { STRAPI_HOST, STRAPI_TOKEN } = process.env;

async function query(url: string) {
  return fetch(`${STRAPI_HOST}/api/${url}`, {
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
  }).then((res) => res.json());
}

export interface Response<T> {
  data: T[];
  error?: {
    details: {
      message: string;
      name: string;
      status: number;
    };
  };
}

export interface PageableResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageCount: number;
      pageSize: number;
      total: number;
    };
  };
}

// CATEGORY

export interface CategoryData {
  id: number;
  name: string;
  products: ProductData[];
}

export async function getCategories(): Promise<PageableResponse<CategoryData>> {
  return query("categories").then((res: PageableResponse<CategoryData>) => res);
}

// SUBCATEGORY

export interface SubcategoryData {
  id: number;
  name: string;
  products: ProductData[];
}

export async function getSubcategories(): Promise<
  PageableResponse<SubcategoryData>
> {
  return query("subcategories").then(
    (res: PageableResponse<SubcategoryData>) => res,
  );
}

// PRODUCT

export interface ProductData {
  id: number;
  name: string;
  price: number;
  alwaysPrepared: boolean;
  category: CategoryData;
  subcategory: SubcategoryData;
}

export async function getProducts(): Promise<PageableResponse<ProductData>> {
  return query("products").then((res: PageableResponse<ProductData>) => res);
}

// PRODUCT ORDER

export interface OrderData {
  id: number;
  quantity: number;
  prepared: boolean;
  served: boolean;
  paid: boolean;
  product: ProductData;
  notes: string;
  orderId: number;
  releasedAt: number;
  tableId: number;
  tableNumber: number;
}

interface OrderStrapiData extends Omit<OrderData, "tableId" | "tableNumber"> {
  table: TableData;
}

export async function getOrders(): Promise<PageableResponse<OrderData>> {
  return query("orders").then((res: PageableResponse<OrderStrapiData>) => {
    return {
      ...res,
      data: res.data.map((order) => ({
        ...order,
        tableId: order.table.id,
        tableNumber: order.table.number,
      })),
    };
  });
}

// TABLE

export interface TableData {
  id: number;
  number: number;
  orders: OrderData[];
}

interface TableStrapiData extends Omit<TableData, "orders"> {
  orders: OrderStrapiData[];
}

export async function getTables(): Promise<PageableResponse<TableData>> {
  return query("tables").then((res: PageableResponse<TableStrapiData>) => {   
    return {
      ...res,
      data: res.data.map((table) => ({
        ...table,
        orders: table.orders?.map((order) => ({
          ...order,
          tableId: order.table.id,
          tableNumber: order.table.number,
        })),
      })),
    };
  });  
}

export async function getTableById(id: number): Promise<Response<TableData>> {
  return query(`tables/${id}`).then((res: Response<TableData>) => res);
}

export async function getTableByNumber(
  number: number,
): Promise<TableData | undefined> {
  return query(`tables?filters[number][$eq]=${number}`).then(
    (res: Response<TableData>) => res.data[0],
  );
}
