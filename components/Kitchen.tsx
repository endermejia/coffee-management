import React from "react";
import { OrderData } from "@/lib/strapi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface KitchenProps {
  pendingPreparation: OrderData[];
  handleUpdateStatus: (
    docId: string,
    prepared: boolean,
    served: boolean,
  ) => void;
}

const Kitchen: React.FC<KitchenProps> = ({
  pendingPreparation,
  handleUpdateStatus,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendiente de preparar</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingPreparation.map(
          (order: OrderData) =>
            order && (
              <div
                key={order.id}
                className="mb-2 p-2 border rounded transition-opacity duration-300"
                style={{ opacity: order.prepared ? 0.5 : 1 }}
              >
                <div className="flex justify-between items-center">
                  <span className="flex-1 space-x-2">
                    {order.quantity > 1 && (
                      <span className="text-muted-foreground">
                        {order.quantity} x
                      </span>
                    )}
                    <strong>{order.product.name}</strong>
                  </span>
                  <span className="text-muted-foreground mr-2">
                    Mesa {order.tableNumber}
                  </span>
                  <Checkbox
                    checked={order.prepared}
                    onCheckedChange={(checked) =>
                      handleUpdateStatus(
                        order.documentId,
                        checked as boolean,
                        order.served,
                      )
                    }
                    disabled={order.product.alwaysPrepared}
                  />
                </div>
                {order.notes && (
                  <span className="text-muted-foreground">
                    Notas: {order.notes}
                  </span>
                )}
              </div>
            ),
        )}
      </CardContent>
    </Card>
  );
};

export default Kitchen;
