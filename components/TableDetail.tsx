'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { FileText } from 'lucide-react'

interface Product {
  id: number
  name: string
  price: number
  prepared: boolean
  served: boolean
  quantity: number
  notes: string
  category: 'bebida' | 'comida'
  subcategory: string
  paid?: boolean
  alwaysPrepared?: boolean
}

interface TableDetailProps {
  tableId: number
  products: Product[]
  availableProducts: Product[]
  onAddProduct: (productId: number) => void
  onUpdateStatus: (productId: number, prepared: boolean, served: boolean) => void
  onUpdateQuantity: (productId: number, quantity: number) => void
  onUpdateNotes: (productId: number, notes: string) => void
  onRemoveProduct: (productId: number) => void
  onReleaseTable: () => void
  onTogglePaid: (productId: number) => void
  unpaidTotal: number
}

const quickNotes = [
  "Sin hielo",
  "Sin azúcar",
  "Para llevar",
  "Extra caliente",
  "Sin lactosa",
  "Sin gluten",
  "Poco hecho",
  "Muy hecho"
]

export default function TableDetail({
  tableId,
  products,
  availableProducts,
  onAddProduct,
  onUpdateStatus,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveProduct,
  onReleaseTable,
  onTogglePaid,
  unpaidTotal
}: TableDetailProps) {
  const [, setSelectedCategory] = useState<'bebida' | 'comida'>('bebida')
  const [noteProductId, setNoteProductId] = useState<number | null>(null)
  const [noteText, setNoteText] = useState('')
  const { toast } = useToast()

  const getStatusColor = (prepared: boolean, served: boolean) => {
    if (served) return 'bg-green-200'
    if (prepared) return 'bg-blue-200'
    return 'bg-yellow-200'
  }

  const handleQuantityChange = (product: Product, newQuantity: number) => {
    if (product.paid) return

    if (newQuantity === 0) {
      onRemoveProduct(product.id)
      toast({
        title: "Producto eliminado",
        description: `${product.name} ha sido eliminado del pedido.`,
        duration: 3000,
        action: (
          <Button variant="outline" size="sm" onClick={() => onAddProduct(product.id)}>
            Deshacer
          </Button>
        ),
      })
    } else {
      onUpdateQuantity(product.id, newQuantity)
    }
  }

  const handleAddNote = (productId: number) => {
    setNoteProductId(productId)
    const product = products.find(p => p.id === productId)
    setNoteText(product?.notes || '')
  }

  const handleSaveNote = () => {
    if (noteProductId !== null) {
      onUpdateNotes(noteProductId, noteText)
      setNoteProductId(null)
      setNoteText('')
    }
  }

  const addQuickNote = (note: string) => {
    setNoteText(prev => prev ? `${prev}, ${note}` : note)
  }

  const groupedAvailableProducts = availableProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = {}
    }
    if (!acc[product.category][product.subcategory]) {
      acc[product.category][product.subcategory] = []
    }
    acc[product.category][product.subcategory].push(product)
    return acc
  }, {} as Record<string, Record<string, Product[]>>)

  return (
    <div className="space-y-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">
            AÑADIR PRODUCTOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bebida" onValueChange={(value) => setSelectedCategory(value as 'bebida' | 'comida')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="bebida" className="text-lg">
                BEBIDAS
              </TabsTrigger>
              <TabsTrigger value="comida" className="text-lg">
                COMIDAS
              </TabsTrigger>
            </TabsList>
            <TabsContent value="bebida">
              {Object.entries(groupedAvailableProducts['bebida'] || {}).map(([subcategory, products]) => (
                <Accordion type="single" collapsible key={subcategory}>
                  <AccordionItem value={subcategory}>
                    <AccordionTrigger>{subcategory.toUpperCase()}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-2">
                        {products.map((product) => (
                          <Button key={product.id} onClick={() => onAddProduct(product.id)} variant="outline" className="justify-start">
                            {product.name}
                          </Button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </TabsContent>
            <TabsContent value="comida">
              {Object.entries(groupedAvailableProducts['comida'] || {}).map(([subcategory, products]) => (
                <Accordion type="single" collapsible key={subcategory}>
                  <AccordionItem value={subcategory}>
                    <AccordionTrigger>{subcategory.toUpperCase()}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-2">
                        {products.map((product) => (
                          <Button key={product.id} onClick={() => onAddProduct(product.id)} variant="outline" className="justify-start">
                            {product.name}
                          </Button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              PRODUCTOS PEDIDOS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <Card key={product.id} className={`${getStatusColor(product.prepared, product.served)} p-4`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex-1 mb-2 sm:mb-0">
                      <h3
                        className={`font-semibold cursor-pointer ${product.paid ? 'line-through text-gray-500' : ''}`}
                        onClick={() => onTogglePaid(product.id)}
                      >
                        {product.name}{' '}
                        {product.quantity > 1
                          ? `(${product.price.toFixed(2)} € x ${product.quantity} = ${(product.price * product.quantity).toFixed(2)} €)`
                          : `${product.price.toFixed(2)} €`
                        }
                      </h3>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleQuantityChange(product, product.quantity - 1)}
                          variant="outline"
                          size="icon"
                          disabled={product.paid || (!product.alwaysPrepared && (product.prepared || product.served))}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleQuantityChange(product, parseInt(e.target.value) || 0)}
                          className="w-16 text-center"
                          disabled={product.paid || (!product.alwaysPrepared && (product.prepared || product.served))}
                        />
                        <Button
                          onClick={() => handleQuantityChange(product, product.quantity + 1)}
                          variant="outline"
                          size="icon"
                          disabled={product.paid || (!product.alwaysPrepared && (product.prepared || product.served))}
                        >
                          +
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!product.alwaysPrepared && (
                          <div className="flex flex-col items-center">
                            <Checkbox
                              id={`prepared-${product.id}`}
                              checked={product.prepared}
                              onCheckedChange={(checked) => onUpdateStatus(product.id, checked as boolean, product.served)}
                            />
                            <label htmlFor={`prepared-${product.id}`} className="text-xs">Prep</label>
                          </div>
                        )}
                        <div className="flex flex-col items-center">
                          <Checkbox
                            id={`served-${product.id}`}
                            checked={product.served}
                            onCheckedChange={(checked) => onUpdateStatus(product.id, product.prepared, checked as boolean)}
                            disabled={!product.prepared && !product.alwaysPrepared}
                          />
                          <label htmlFor={`served-${product.id}`} className="text-xs">Serv</label>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleAddNote(product.id)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Nota
                      </Button>
                    </div>
                  </div>
                  {product.notes && (
                    <p className="mt-2 text-sm text-gray-600">{product.notes}</p>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="sticky bottom-2 bg-primary text-primary-foreground">
        <CardContent className="flex justify-between items-center p-6">
          <CardTitle className="text-2xl">Mesa {tableId}</CardTitle>
          <Button onClick={onReleaseTable}>
            <span className="text-3xl font-bold">{unpaidTotal.toFixed(2)} €</span>
          </Button>
        </CardContent>
      </Card>
      <Dialog open={noteProductId !== null} onOpenChange={(open) => !open && setNoteProductId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir nota</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Escribe una nota..."
            className="mb-4"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            {quickNotes.map((note, index) => (
              <Button key={index} variant="outline" onClick={() => addQuickNote(note)}>
                {note}
              </Button>
            ))}
          </div>
          <Button onClick={handleSaveNote}>Guardar nota</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}