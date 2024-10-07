import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Table {
  id: number
  occupied: boolean
  total: number
  unpaidTotal: number
}

interface TableOverviewProps {
  tables: Table[]
  onTableSelect: (tableId: number) => void
  getTableColor: (tableId: number) => string
}

export default function TableOverview({ tables, onTableSelect, getTableColor }: TableOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map((table) => (
        <Card key={table.id} className={`${getTableColor(table.id)} hover:shadow-lg transition-shadow`}>
          <CardContent className="p-4">
            <Button
              onClick={() => onTableSelect(table.id)}
              variant={table.occupied ? "default" : "outline"}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <span className="text-lg font-bold">Mesa {table.id}</span>
              {table.occupied && (
                <span className="mt-2">{table.unpaidTotal.toFixed(2)} €</span>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}