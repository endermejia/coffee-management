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

// SUBCATEGORY

export interface SubcategoryData {
  id: number;
  name: string;
  products: ProductData[];
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

// PRODUCT ORDER

export interface ProductOrderData {
  id: number;
  quantity: number;
  prepared: boolean;
  served: boolean;
  paid: boolean;
  product: ProductData;
  notes: string;
  orderId: number;
}

// ORDER

export interface OrderData {
  id: number;
  releasedAt: number;
  tableId: number;
  product_orders: ProductOrderData[];
}

// TABLE

export interface TableData {
  id: number;
  number: number;
  orders: OrderData[];
}

export async function getTables(): Promise<PageableResponse<TableData>> {
  return query("tables").then((res: PageableResponse<TableData>) => res);
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
