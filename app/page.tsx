'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  ChefHat,
  ChevronsUp,
  ClipboardList,
  HandPlatter,
  Home as HomeIcon,
  Minus,
  Plus,
  Search,
  Settings,
  Trash2
} from 'lucide-react'
import Login from '../components/Login'
import TableOverview from '../components/TableOverview'
import TableDetail from '../components/TableDetail'
import ConfirmationModal from '../components/ConfirmationModal'

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
  tableId?: number
  paid?: boolean
  alwaysPrepared?: boolean
}

interface Table {
  id: number
  occupied: boolean
  total: number
  unpaidTotal: number
}

interface Order {
  id: number
  tableId: number
  products: Product[]
  total: number
  releasedAt: number
}

interface AppConfig {
  disableNotifications: boolean
  notificationDuration: number
  theme: 'light' | 'dark'
}

const initialProducts: Product[] = [
  { id: 1, name: 'Café', price: 1.20, prepared: false, served: false, quantity: 1, notes: '', category: 'bebida', subcategory: 'caliente' },
  { id: 2, name: 'Té', price: 1.00, prepared: false, served: false, quantity: 1, notes: '', category: 'bebida', subcategory: 'caliente' },
  { id: 3, name: 'Coca-Cola', price: 1.50, prepared: true, served: false, quantity: 1, notes: '', category: 'bebida', subcategory: 'fría', alwaysPrepared: true },
  { id: 4, name: 'Agua', price: 1.00, prepared: true, served: false, quantity: 1, notes: '', category: 'bebida', subcategory: 'fría', alwaysPrepared: true },
  { id: 5, name: 'Tostada', price: 1.50, prepared: false, served: false, quantity: 1, notes: '', category: 'comida', subcategory: 'desayuno' },
  { id: 6, name: 'Croissant', price: 1.20, prepared: false, served: false, quantity: 1, notes: '', category: 'comida', subcategory: 'desayuno' },
  { id: 7, name: 'Bocadillo', price: 3.50, prepared: false, served: false, quantity: 1, notes: '', category: 'comida', subcategory: 'almuerzo' },
  { id: 8, name: 'Ensalada', price: 4.50, prepared: false, served: false, quantity: 1, notes: '', category: 'comida', subcategory: 'almuerzo' },
]

const initialConfig: AppConfig = {
  disableNotifications: false,
  notificationDuration: 2000,
  theme: 'light'
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [tableProducts, setTableProducts] = useState<Record<number, Product[]>>({})
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [numberOfTables, setNumberOfTables] = useState(12)
  const [orders, setOrders] = useState<Order[]>([])
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [config, setConfig] = useState<AppConfig>(initialConfig)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLiquidateConfirmationOpen, setIsLiquidateConfirmationOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tables')
  const { toast } = useToast()

  useEffect(() => {
    setTables(Array.from({ length: numberOfTables }, (_, i) => ({
      id: i + 1,
      occupied: false,
      total: 0,
      unpaidTotal: 0,
    })))
  }, [numberOfTables])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.className = config.theme
  }, [config.theme])

  const handleLogin = (username: string, password: string) => {
    if (username === 'admin' && password === 'password') {
      setIsLoggedIn(true)
    } else {
      alert('Credenciales incorrectas')
    }
  }

  const calculateTableTotal = useCallback((products: Product[]) => {
    return products.reduce((total, product) => total + (product.price * product.quantity), 0)
  }, [])

  const calculateTableUnpaidTotal = useCallback((products: Product[]) => {
    return products.reduce((total, product) => {
      if (!product.paid) {
        return total + (product.price * product.quantity)
      }
      return total
    }, 0)
  }, [])

  const updateTableTotals = useCallback((tableId: number, products: Product[]) => {
    setTables(prev => prev.map(table =>
      table.id === tableId
        ? {
            ...table,
            total: calculateTableTotal(products),
            unpaidTotal: calculateTableUnpaidTotal(products),
            occupied: products.length > 0
          }
        : table
    ))
  }, [calculateTableTotal, calculateTableUnpaidTotal])

  const handleAddProduct = (productId: number) => {
    if (!selectedTable) return

    const productToAdd = initialProducts.find(p => p.id === productId)
    if (!productToAdd) return

    setTableProducts(prev => {
      const updatedProducts = [...(prev[selectedTable] || []), { ...productToAdd, tableId: selectedTable, id: Date.now() }]
      updateTableTotals(selectedTable, updatedProducts)
      return { ...prev, [selectedTable]: updatedProducts }
    })
  }

  const handleUpdateStatus = (productId: number, prepared: boolean, served: boolean) => {
    if (!selectedTable) return

    setTableProducts(prev => {
      const updatedProducts = prev[selectedTable].map(product =>
        product.id === productId
          ? { ...product, prepared: served ? true : prepared, served }
          : product
      )
      updateTableTotals(selectedTable, updatedProducts)
      return { ...prev, [selectedTable]: updatedProducts }
    })

    if (!config.disableNotifications) {
      if (prepared && !served) {
        toast({
          title: "Producto preparado",
          description: "El producto ha sido marcado como preparado.",
          duration: config.notificationDuration,
          action: (
            <Button variant="outline" size="sm" onClick={() => {
              handleUpdateStatus(productId, false, false)
              toast({
                title: "Acción deshecha",
                description: "El producto ha sido marcado como no preparado.",
                duration: config.notificationDuration,
              })
            }}>
              Deshacer
            </Button>
          ),
        })
      } else if (served) {
        toast({
          title: "Producto servido",
          description: "El producto ha sido marcado como servido.",
          duration: config.notificationDuration,
          action: (
            <Button variant="outline" size="sm" onClick={() => {
              handleUpdateStatus(productId, true, false)
              toast({
                title: "Acción deshecha",
                description: "El producto ha sido marcado como no servido.",
                duration: config.notificationDuration,
              })
            }}>
              Deshacer
            </Button>
          ),
        })
      }
    }
  }

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (!selectedTable) return

    setTableProducts(prev => {
      const updatedProducts = prev[selectedTable].map(product =>
        product.id === productId ? { ...product, quantity } : product
      )
      updateTableTotals(selectedTable, updatedProducts)
      return { ...prev, [selectedTable]: updatedProducts }
    })
  }

  const handleUpdateNotes = (productId: number, notes: string) => {
    if (!selectedTable) return

    setTableProducts(prev => ({
      ...prev,
      [selectedTable]: prev[selectedTable].map(product =>
        product.id === productId ? { ...product, notes } : product
      )
    }))
  }

  const handleRemoveProduct = (productId: number) => {
    if (!selectedTable) return

    setTableProducts(prev => {
      const removedProduct = prev[selectedTable].find(product => product.id === productId)
      const updatedProducts = prev[selectedTable].filter(product => product.id !== productId)
      updateTableTotals(selectedTable, updatedProducts)

      if (removedProduct && !config.disableNotifications) {
        toast({
          title: "Producto eliminado",
          description: `${removedProduct.name} ha sido eliminado del pedido.`,
          duration: config.notificationDuration,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTableProducts(prevState => {
                  const restoredProducts = [...prevState[selectedTable], { ...removedProduct, id: Date.now() }]
                  updateTableTotals(selectedTable, restoredProducts)
                  return { ...prevState, [selectedTable]: restoredProducts }
                })
                toast({
                  title: "Producto restaurado",
                  description: `${removedProduct.name} ha sido restaurado al pedido.`,
                  duration: config.notificationDuration,
                })
              }}
            >
              Deshacer
            </Button>
          ),
        })
      }

      return { ...prev, [selectedTable]: updatedProducts }
    })
  }

  const handleReleaseTable = () => {
    setIsConfirmationModalOpen(true)
  }

  const confirmReleaseTable = () => {
    if (!selectedTable) return

    const tableOrder = tableProducts[selectedTable]
    if (tableOrder && tableOrder.length > 0) {
      const newOrder: Order = {
        id: Date.now(),
        tableId: selectedTable,
        products: tableOrder,
        total: calculateTableTotal(tableOrder),
        releasedAt: Date.now(),
      }
      setOrders(prev => [...prev, newOrder])
    }

    setTableProducts(prev => {
      const { [selectedTable]: _, ...rest } = prev
      return rest
    })

    setTables(prev => prev.map(table =>
      table.id === selectedTable ? { ...table, occupied: false, total: 0, unpaidTotal: 0 } : table
    ))

    setSelectedTable(null)
    setIsConfirmationModalOpen(false)

    if (!config.disableNotifications) {
      toast({
        title: "Mesa liberada",
        description: `La mesa ${selectedTable} ha sido liberada.`,
        duration: config.notificationDuration,
      })
    }
  }

  const handleTogglePaid = (productId: number) => {
    if (!selectedTable) return

    setTableProducts(prev => {
      const updatedProducts = prev[selectedTable].map(product => {
        if (product.id === productId) {
          return { ...product, paid: !product.paid }
        }
        return product
      })
      updateTableTotals(selectedTable, updatedProducts)
      return { ...prev, [selectedTable]: updatedProducts }
    })
  }

  const handleLiquidateOrders = () => {
    setIsLiquidateConfirmationOpen(true)
  }

  const confirmLiquidateOrders = () => {
    setOrders([])
    setIsOrderDialogOpen(false)
    setIsLiquidateConfirmationOpen(false)
    if (!config.disableNotifications) {
      toast({
        title: "Pedidos liquidados",
        description: "Todos los pedidos han sido liquidados.",
        duration: config.notificationDuration,
      })
    }
  }

  const getTableColor = (table: Table) => {
    if (!table.occupied) return 'bg-gray-200'
    if (table.unpaidTotal === 0) return 'bg-green-200'
    return 'bg-yellow-200'
  }

  const handleStatusChange = (productId: number, prepared: boolean, served: boolean) => {
    setTableProducts(prev => {
      const updatedTableProducts: Record<number, Product[]> = {}

      for (const [tableId, products] of Object.entries(prev)) {
        const updatedProducts = products.map(product =>
          product.id === productId
            ? { ...product, prepared: served ? true : prepared, served }
            : product
        )
        updatedTableProducts[Number(tableId)] = updatedProducts
        updateTableTotals(Number(tableId), updatedProducts)
      }

      return updatedTableProducts
    })

    if (!config.disableNotifications) {
      if (prepared && !served) {
        toast({
          title: "Producto preparado",
          description: "El producto ha sido marcado como preparado.",
          duration: config.notificationDuration,
          action: (
            <Button variant="outline" size="sm" onClick={() => {
              handleStatusChange(productId, false, false)
              toast({
                title: "Acción deshecha",
                description: "El producto ha sido marcado como no preparado.",
                duration: config.notificationDuration,
              })
            }}>
              Deshacer
            </Button>
          ),
        })
      } else if (served) {
        toast({
          title: "Producto servido",
          description: "El producto ha sido marcado como servido.",
          duration: config.notificationDuration,
          action: (
            <Button variant="outline" size="sm" onClick={() => {
              handleStatusChange(productId, true, false)
              toast({
                title: "Acción deshecha",
                description: "El producto ha sido marcado como no servido.",
                duration: config.notificationDuration,
              })
            }}>
              Deshacer
            </Button>
          ),
        })
      }
    }
  }

  const pendingPreparation = Object.values(tableProducts)
    .flat()
    .filter(product => !product.prepared && !product.alwaysPrepared)
    .sort((a, b) => (a.tableId || 0) - (b.tableId || 0))

  const pendingService = Object.values(tableProducts)
    .flat()
    .filter(product => product.prepared && !product.served)
    .sort((a, b) => (a.tableId || 0) - (b.tableId || 0))

  const calculateTotalLiquidation = () => {
    return orders.reduce((total, order) => total + order.total, 0)
  }

  const normalizeString = (str: string) => {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  }

  const filteredProducts = initialProducts.filter(product =>
    normalizeString(product.name).includes(normalizeString(searchTerm))
  )

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className={`container mx-auto p-2 ${config.theme}`}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex space-x-2">
          <div className="flex-1" onClick={() => setSelectedTable(null)} >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tables" className="text-lg">
                <span className="hidden md:inline">Mesas</span>
                <HomeIcon className="inline md:hidden m-1"/>
              </TabsTrigger>
              <TabsTrigger value="kitchen" className="text-lg">
                <span className="hidden md:inline">Cocina</span>
                <ChefHat className="inline md:hidden m-1"/>
                {pendingPreparation.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-yellow-400 text-black rounded-full text-xs">
                  {pendingPreparation.length}
                </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="service" className="text-lg">
                <span className="hidden md:inline">Servicio</span>
                <HandPlatter className="inline md:hidden m-1"/>
                {pendingService.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-blue-400 text-black rounded-full text-xs">
                  {pendingService.length}
                </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="space-x-2">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4"/>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configuración</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="disable-notifications">Deshabilitar notificaciones</Label>
                    <Switch
                        id="disable-notifications"
                        checked={config.disableNotifications}
                        onCheckedChange={(checked) => setConfig(prev => ({...prev, disableNotifications: checked}))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notification-duration">Duración de notificaciones (segundos)</Label>
                    <Input
                        id="notification-duration"
                        type="number"
                        value={config.notificationDuration / 1000}
                        onChange={(e) => {
                          const value = Math.max(1, parseInt(e.target.value))
                          setConfig(prev => ({...prev, notificationDuration: value * 1000}))
                        }}
                        min="1"
                        className="w-20 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme">Tema</Label>
                    <select
                        id="theme"
                        value={config.theme}
                        onChange={(e) => setConfig(prev => ({...prev, theme: e.target.value as 'light' | 'dark'}))}
                        className="border rounded p-2"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="num-tables">Número de mesas</Label>
                    <div className="flex items-center space-x-2">
                      <Button onClick={() => setNumberOfTables(prev => Math.max(1, prev - 1))}>
                        <Minus className="h-4 w-4"/>
                      </Button>
                      <Input
                          id="num-tables"
                          type="number"
                          value={numberOfTables}
                          onChange={(e) => setNumberOfTables(parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-20 text-center"
                      />
                      <Button onClick={() => setNumberOfTables(prev => prev + 1)}>
                        <Plus className="h-4 w-4"/>
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" disabled={orders.length === 0}>
                  <ClipboardList className="h-4 w-4"/>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registro de pedidos</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {orders.map((order) => (
                      <Card key={order.id} className="mb-4">
                        <CardHeader>
                          <CardTitle>Mesa {order.tableId} - Total: {order.total.toFixed(2)} €</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground text-sm mb-2">
                            {new Date(order.releasedAt).toLocaleString()}
                          </p>
                          <ul>
                            {order.products.map((product) => (
                                <li key={product.id}>
                                  {product.name} x{product.quantity} - {(product.price * product.quantity).toFixed(2)} €
                                </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                  ))}
                </div>
                <div className="mt-4 flex justify-between items-center space-x-4">
                  <Card className="bg-primary text-primary-foreground flex-grow">
                    <CardContent className="flex justify-between items-center p-4">
                      <CardTitle className="text-xl">TOTAL</CardTitle>
                      <span className="text-2xl font-bold">{calculateTotalLiquidation().toFixed(2)} €</span>
                    </CardContent>
                  </Card>
                  <Button
                      variant="destructive"
                      onClick={handleLiquidateOrders}
                      disabled={orders.length === 0}
                      className="h-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2"/>
                    Liquidar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="tables">
          {selectedTable ? (
              <TableDetail
                  tableId={selectedTable}
                  products={tableProducts[selectedTable] || []}
                  availableProducts={initialProducts}
                  onAddProduct={handleAddProduct}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateQuantity={handleUpdateQuantity}
                  onUpdateNotes={handleUpdateNotes}
                  onRemoveProduct={handleRemoveProduct}
                  onReleaseTable={handleReleaseTable}
                  onTogglePaid={handleTogglePaid}
                  unpaidTotal={tables.find(t => t.id === selectedTable)?.unpaidTotal || 0}
              >
                <div className="mb-4">
                  <Label htmlFor="product-search">Buscar producto</Label>
                  <div className="flex items-center mt-1">
                    <Search className="w-5 h-5 mr-2 text-gray-400"/>
                    <Input
                        id="product-search"
                        type="text"
                        placeholder="Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                      <Button
                          key={product.id}
                          onClick={() => handleAddProduct(product.id)}
                          className="text-left"
                      >
                        {product.name}
                      </Button>
                  ))}
                </div>
              </TableDetail>
          ) : (
              <TableOverview
                  tables={tables}
                  onTableSelect={setSelectedTable}
                  getTableColor={getTableColor}
              />
          )}
        </TabsContent>

        <TabsContent value="kitchen">
          <Card>
            <CardHeader>
              <CardTitle>Pendiente de preparar</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPreparation.map((product) => (
                  <div key={product.id}
                       className="mb-2 p-2 border rounded transition-opacity duration-300"
                       style={{opacity: product.prepared ? 0.5 : 1}}>
                    <div className="flex justify-between items-center">
                    <span className="flex-1">
                      <strong>{product.name}</strong>
                    </span>
                      <span className="text-muted-foreground mr-2">Mesa {product.tableId}</span>
                      <Checkbox
                          checked={product.prepared}
                          onCheckedChange={(checked) => handleStatusChange(product.id, checked as boolean, product.served)}
                          disabled={product.alwaysPrepared}
                      />
                    </div>
                    {product.notes && (
                        <span className="text-muted-foreground">Notas: {product.notes}</span>
                    )}
                  </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service">
          <Card>
            <CardHeader>
              <CardTitle>Pendiente de servir</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingService.map((product) => (
                  <div key={product.id} className="mb-2 p-2 border rounded transition-opacity duration-300"
                       style={{opacity: product.served ? 0.5 : 1}}>
                    <div className="flex justify-between items-center">
                    <span className="flex-1">
                      <strong>{product.name}</strong>
                    </span>
                      <span className="text-muted-foreground mr-2">Mesa {product.tableId}</span>
                      <Checkbox
                          checked={product.served}
                          onCheckedChange={(checked) => handleStatusChange(product.id, product.prepared, checked as boolean)}
                      />
                    </div>
                    {product.notes && (
                        <span className="text-muted-foreground">Notas: {product.notes}</span>
                    )}
                  </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          onConfirm={confirmReleaseTable}
          title="Confirmar liberación de mesa"
          description="¿Estás seguro de que quieres liberar esta mesa? Todos los productos asociados serán eliminados."
      />
      <ConfirmationModal
          isOpen={isLiquidateConfirmationOpen}
          onClose={() => setIsLiquidateConfirmationOpen(false)}
          onConfirm={confirmLiquidateOrders}
          title="Confirmar liquidación de pedidos"
          description="¿Estás seguro de que quieres liquidar todos los pedidos? Esta acción no se puede deshacer."
      />
      <Toaster/>
      {showScrollToTop && (
          <Button
              className="fixed top-4 right-4 rounded-full p-3 transition-opacity duration-300 z-50"
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          >
            <ChevronsUp className="h-6 w-6"/>
          </Button>
      )}
    </div>
  )
}