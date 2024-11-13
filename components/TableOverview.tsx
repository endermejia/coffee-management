import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderData, TableData } from "@/lib/strapi";

interface TableOverviewProps {
  tables: TableData[];
  onTableSelect: (tableId: number) => void;
  getTableColor: (orders: OrderData[]) => string;
  calculateTableUnpaidTotal: (orders: OrderData[]) => number;
}

export default function TableOverview({
  tables,
  onTableSelect,
  getTableColor,
  calculateTableUnpaidTotal,
}: TableOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map((table: TableData) => (
        <Card
          key={table.id}
          className={`${getTableColor(table.orders?.filter((o) => !o.releasedAt))} hover:shadow-lg transition-shadow`}
        >
          <CardContent className="p-4">
            <Button
              onClick={() => onTableSelect(table.id)}
              variant={
                table.orders?.filter((o) => !o.releasedAt).length ? "default" : "outline"
              }
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <span className="text-lg font-bold">{table.number}</span>
              {table.orders?.filter((o) => !o.releasedAt).length > 0 && (
                <span className="mt-2">
                  {calculateTableUnpaidTotal(
                    table.orders.filter((o) => !o.releasedAt),
                  ).toFixed(2)}{" "}
                  €
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
