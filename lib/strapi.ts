"use server";

const { STRAPI_HOST, STRAPI_TOKEN } = process.env;

async function query(url: string, method: string = "GET", body?: unknown) {
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify({ data: body });
  }

  const response = await fetch(`${STRAPI_HOST}/api/${url}`, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
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

export async function getProducts(): Promise<PageableResponse<ProductData>> {
  return query("products?populate[0]=category&populate[1]=subcategory").then(
    (res: PageableResponse<ProductData>) => res,
  );
}

// ORDER

export interface OrderData {
  id: number;
  quantity: number;
  prepared: boolean;
  served: boolean;
  paid: boolean;
  product: ProductData;
  notes: string;
  releasedAt: number;
  tableId: number;
  tableNumber: number;
}

interface OrderStrapiData extends Omit<OrderData, "tableId" | "tableNumber"> {
  table: TableData;
}

export async function createOrder(
  orderData: Omit<OrderData, "id" | "tableId" | "tableNumber" | "product"> & {
    table: number;
    product: number;
  },
): Promise<Response<OrderData>> {
  return query("orders", "POST", orderData);
}

export async function updateOrder(
  id: number,
  orderData: Partial<OrderData>,
): Promise<Response<OrderData>> {
  return query(`orders/${id}`, "PUT", orderData);
}

export async function deleteOrder(id: number): Promise<Response<OrderData>> {
  return query(`orders/${id}`, "DELETE");
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

export async function createTable(
  tableData: Omit<TableData, "id">,
): Promise<Response<TableData>> {
  return query("tables", "POST", tableData);
}

export async function updateTable(
  id: number,
  tableData: Partial<TableData>,
): Promise<Response<TableData>> {
  return query(`tables/${id}`, "PUT", tableData);
}

export async function deleteTable(id: number): Promise<Response<TableData>> {
  return query(`tables/${id}`, "DELETE");
}
