import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrderData } from "@/lib/strapi";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateTotalByOrders = (orders: OrderData[]): number =>
  orders?.reduce(
    (total, order) =>
      total +
      (order.product.price +
        (order.extras?.reduce(
          (extraTotal, extra) => extraTotal + extra.price,
          0,
        ) || 0)) *
        order.quantity,
    0,
  );

export const calculateUnpaidTotalByOrders = (orders: OrderData[]): number =>
  orders?.reduce(
    (total, order) =>
      total +
      (order.paid
        ? 0
        : (order.product.price +
            order.extras?.reduce(
              (extraTotal, extra) => extraTotal + extra.price,
              0,
            ) || 0) * order.quantity),
    0,
  );

export const getStatusColorByOrders = (orders: OrderData[]) => {
  if (!orders || !orders.length) return "bg-gray-200";
  if (orders.some((order: OrderData) => !order.prepared))
    return orders.some((order: OrderData) => order.prepared && !order.served)
      ? "bg-gradient-to-r from-yellow-200 to-blue-200"
      : "bg-yellow-200";
  if (orders.some((order: OrderData) => !order.served)) return "bg-blue-200";
  return "bg-green-200";
};
