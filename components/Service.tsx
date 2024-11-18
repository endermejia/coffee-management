import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {OrderData} from "@/lib/strapi";

interface ServiceProps {
  pendingService: OrderData[];
  handleUpdateStatus: (
    documentId: string,
    prepared: boolean,
    served: boolean,
  ) => void;
}

const Service: React.FC<ServiceProps> = ({
  pendingService,
  handleUpdateStatus,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendiente de servir</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingService.map(
          (order: OrderData) =>
            order && (
              <div
                key={order.id}
                className="mb-2 p-2 border rounded transition-opacity duration-300"
                style={{ opacity: order.served ? 0.5 : 1 }}
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
                    checked={order.served}
                    onCheckedChange={(checked) =>
                      handleUpdateStatus(
                        order.documentId,
                        order.prepared,
                        checked as boolean,
                      )
                    }
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

export default Service;
