import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderData } from "@/lib/strapi";

interface ReleasedOrdersProps {
  isOrderDialogOpen: boolean;
  setIsOrderDialogOpen: (isOpen: boolean) => void;
  releasedOrders: OrderData[];
  groupedReleasedOrders: { [key: string]: OrderData[] };
  totalByOrders: (orders: OrderData[]) => number;
  handleLiquidateOrders: () => void;
  calculateTotalLiquidation: () => number;
}

const ReleasedOrders: React.FC<ReleasedOrdersProps> = ({
  isOrderDialogOpen,
  setIsOrderDialogOpen,
  releasedOrders,
  groupedReleasedOrders,
  totalByOrders,
  handleLiquidateOrders,
  calculateTotalLiquidation,
}) => {
  return (
    <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={releasedOrders.length === 0}
        >
          <ClipboardList className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registro de pedidos</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {Object.entries(groupedReleasedOrders).map(
            ([releasedAt, orders]: [string, OrderData[]]) => (
              <Card key={releasedAt} className="mb-4">
                <CardHeader>
                  <CardTitle>
                    Mesa {orders[0].tableNumber} - Total:{" "}
                    {totalByOrders(orders).toFixed(2)} €
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-2">
                    {new Date(Number(releasedAt)).toLocaleString()}
                  </p>
                  <ul>
                    {orders.map((order: OrderData) => (
                      <li key={order.id} className="mb-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">
                              {order.product.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold bg-gray-100 px-2 py-1 rounded">
                              x{order.quantity}
                            </span>
                          </div>
                          <span className="font-semibold">
                            {(
                              (order.product.price +
                                order.extras.reduce(
                                  (extraTotal, extra) =>
                                    extraTotal + extra.price,
                                  0,
                                )) *
                              order.quantity
                            ).toFixed(2)}{" "}
                            €
                          </span>
                        </div>
                        {order.extras && order.extras.length > 0 && (
                          <ul className="ml-6 mt-1 text-sm text-muted-foreground list-disc">
                            {order.extras.map((extra) => (
                              <li key={extra.id}>{extra.name}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ),
          )}
        </div>
        <Card className="sticky bottom-2 bg-primary text-primary-foreground flex-grow">
          <CardContent className="flex justify-between items-center p-4">
            <CardTitle className="text-xl">TOTAL</CardTitle>
            <Button
              onClick={handleLiquidateOrders}
              disabled={releasedOrders.length === 0}
            >
              <span className="text-2xl font-bold">
                {calculateTotalLiquidation().toFixed(2)} €
              </span>
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ReleasedOrders;
