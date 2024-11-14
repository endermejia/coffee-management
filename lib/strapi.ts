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

  try {
    const response: Response = await fetch(
      `${STRAPI_HOST}/api/${url}`,
      options,
    );

    if (!response.ok) {
      const errorDetails = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      return {
        data: [],
        error: {
          details: {
            message:
              errorDetails.error?.message ||
              `HTTP error! status: ${response.status}`,
            name: errorDetails.error?.name || "RequestError",
            status: response.status,
          },
        },
      };
    }

    // Verificar que el contenido sea JSON y que no esté vacío
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    // Devolver un objeto vacío si no hay JSON en la respuesta
    return { data: [] };
  } catch (error) {
    return {
      data: [],
      error: {
        details: {
          message: (error as Error).message,
          name: "FetchError",
          status: 500,
        },
      },
    };
  }
}

export interface ResponseStrapi<T> {
  data: T[];
  error?: {
    details: {
      message: string;
      name: string;
      status: number;
    };
  };
}

export interface PageableResponseStrapi<T> {
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

// QUICK NOTE
export interface QuickNoteData {
  id: number;
  documentId: string;
  name: string;
}

// EXTRA
export interface ExtraData {
  id: number;
  documentId: string;
  name: string;
  price: number;
}

// CATEGORY

export interface CategoryData {
  id: number;
  documentId: string;
  name: string;
  products: ProductData[];
}

// SUBCATEGORY

export interface SubcategoryData {
  id: number;
  documentId: string;
  name: string;
  products: ProductData[];
}

// PRODUCT

export interface ProductData {
  id: number;
  documentId: string;
  name: string;
  price: number;
  alwaysPrepared: boolean;
  category: CategoryData;
  subcategory: SubcategoryData;
  quick_notes: QuickNoteData[];
}

export async function getProducts(): Promise<
  PageableResponseStrapi<ProductData>
> {
  return query("products?populate[0]=category&populate[1]=subcategory&populate[2]=quick_notes").then(
    (res: PageableResponseStrapi<ProductData>) => res,
  );
}

// TODO: crud products

// ORDER

export interface OrderData {
  id: number;
  documentId: string;
  quantity: number;
  prepared: boolean;
  served: boolean;
  paid: boolean;
  product: ProductData;
  extras: ExtraData[];
  notes: string;
  createdAt: number;
  updatedAt: number;
  releasedAt: number;
  tableId: number;
  tableNumber: number;
}

interface OrderStrapiData extends Omit<OrderData, "tableId" | "tableNumber"> {
  table: TableData;
}

export async function createOrder(
  orderData: Omit<
    OrderData,
    "id" | "documentId" | "tableId" | "tableNumber" | "product" | "createdAt" | "updatedAt" | "releasedAt"
  > & {
    table: number;
    product: number;
  },
): Promise<ResponseStrapi<OrderData>> {
  return query("orders", "POST", orderData);
}

export async function updateOrder(
  documentId: string,
  orderData: Partial<OrderData>,
): Promise<ResponseStrapi<OrderData>> {
  return query(`orders/${documentId}`, "PUT", orderData);
}

export async function deleteOrder(
  documentId: string,
): Promise<ResponseStrapi<OrderData>> {
  return query(`orders/${documentId}`, "DELETE");
}

// TABLE

export interface TableData {
  id: number;
  documentId: string;
  number: number;
  orders: OrderData[];
}

interface TableStrapiData extends Omit<TableData, "orders"> {
  orders: OrderStrapiData[];
}

export async function getTables(): Promise<PageableResponseStrapi<TableData>> {
  return query("tables?populate[orders][populate][0]=product&populate[orders][populate][1]=extras").then(
    (res: PageableResponseStrapi<TableStrapiData>) => {
      return {
        ...res,
        data: res.data
          .map((table) => ({
            ...table,
            orders:
              table.orders
                ?.map((order) => ({
                  ...order,
                  tableId: table.id,
                  tableNumber: table.number,
                }))
                .sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
                ) || [],
          }))
          .sort((a, b) => a.number - b.number),
      };
    },
  );
}

export async function createTable(
  tableData: Omit<TableData, "id" | "documentId">,
): Promise<ResponseStrapi<TableData>> {
  return query("tables", "POST", tableData);
}

export async function deleteTable(
  documentId: string,
): Promise<ResponseStrapi<TableData>> {
  return query(`tables/${documentId}`, "DELETE");
}
