import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { useSuppliers, Supplier } from '@/hooks/useSuppliers';
import { SupplierModal } from '@/components/suppliers/SupplierModal';
import { DeleteSupplierModal } from '@/components/suppliers/DeleteSupplierModal';

export default function Fornecedores() {
  const { suppliers, loading, isAdmin, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Extract regime from observacoes
  const getRegimeFromObservacoes = (observacoes?: string) => {
    if (!observacoes) return null;
    const match = observacoes.match(/REGIME:\s*([^|]+)/);
    return match ? match[1].trim() : null;
  };

  // Format contact info (phone + email)
  const formatContact = (supplier: Supplier) => {
    const contacts = [];
    
    if (supplier.telefone) {
      contacts.push(supplier.telefone);
    }
    
    if (supplier.email) {
      contacts.push(supplier.email);
    }
    
    if (supplier.contato) {
      contacts.push(supplier.contato);
    }
    
    return contacts.length > 0 ? contacts.join(' • ') : 'Não informado';
  };

  // Get regime badge variant
  const getRegimeBadgeVariant = (regime: string | null) => {
    switch (regime) {
      case 'consignacao': return 'secondary';
      case 'venda_direta': return 'default';
      case 'ambos': return 'destructive';
      default: return 'outline';
    }
  };

  // Format regime display
  const formatRegime = (regime: string | null) => {
    switch (regime) {
      case 'consignacao': return 'Consignação';
      case 'venda_direta': return 'Venda Direta';
      case 'ambos': return 'Ambos';
      default: return 'Não definido';
    }
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setShowModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const handleSaveSupplier = async (supplierData: any) => {
    setActionLoading(true);
    
    try {
      let result;
      if (selectedSupplier) {
        result = await updateSupplier(selectedSupplier.id, supplierData);
      } else {
        result = await createSupplier(supplierData);
      }
      
      if (!result.error) {
        setShowModal(false);
        setSelectedSupplier(null);
      }
      
      return result;
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;
    
    setActionLoading(true);
    
    try {
      const result = await deleteSupplier(selectedSupplier.id);
      
      if (!result.error) {
        setShowDeleteModal(false);
        setSelectedSupplier(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card className="glass-card border-0">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Acesso negado. Apenas proprietários e gerentes podem visualizar fornecedores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Fornecedores</CardTitle>
            <Button onClick={handleAddSupplier} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Fornecedor
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card className="glass-card border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Carregando fornecedores...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Nenhum fornecedor cadastrado ainda.
              </p>
              <Button onClick={handleAddSupplier} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Fornecedor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Nome do Fornecedor</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Regime</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => {
                  const regime = getRegimeFromObservacoes(supplier.observacoes);
                  
                  return (
                    <TableRow key={supplier.id} className="border-border/50">
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{supplier.nome}</span>
                          {supplier.endereco && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{supplier.endereco}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{formatContact(supplier)}</span>
                          {supplier.contato && (
                            <span className="text-xs text-muted-foreground">
                              Contato: {supplier.contato}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRegimeBadgeVariant(regime)}>
                          {formatRegime(regime)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background">
                            <DropdownMenuItem
                              onClick={() => handleEditSupplier(supplier)}
                              className="gap-2"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSupplier(supplier)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <SupplierModal
        supplier={selectedSupplier}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedSupplier(null);
        }}
        onSave={handleSaveSupplier}
        loading={actionLoading}
      />

      {selectedSupplier && (
        <DeleteSupplierModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedSupplier(null);
          }}
          onConfirm={handleConfirmDelete}
          supplier={selectedSupplier}
          loading={actionLoading}
        />
      )}
    </div>
  );
}