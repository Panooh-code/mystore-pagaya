import { useState } from 'react';
import { Users, MoreVertical, UserCheck, UserX, Crown, Shield, User, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployeeManagement, type Employee } from '@/hooks/useEmployeeManagement';

const Gerenciamento = () => {
  const {
    employees,
    loading,
    error,
    updateEmployeeRole,
    updateEmployeeStatus,
    deleteEmployee,
    getAvailableActions,
    refetch,
  } = useEmployeeManagement();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const getStatusBadge = (status: Employee['status']) => {
    const variants = {
      'ativo': 'default',
      'pendente': 'secondary',
      'bloqueado': 'destructive',
    } as const;

    const labels = {
      'ativo': 'Ativo',
      'pendente': 'Pendente',
      'bloqueado': 'Bloqueado',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getRoleBadge = (role: Employee['role']) => {
    const icons = {
      'proprietario': Crown,
      'gerente': Shield,
      'vendedor': User,
    };

    const labels = {
      'proprietario': 'Proprietário',
      'gerente': 'Gerente',
      'vendedor': 'Vendedor',
    };

    const IconComponent = icons[role];

    return (
      <div className="flex items-center gap-2">
        <IconComponent className="h-4 w-4" />
        {labels[role]}
      </div>
    );
  };

  const handleAction = async (employee: Employee, action: string) => {
    switch (action) {
      case 'aprovar':
        await updateEmployeeStatus(employee.id, 'ativo');
        break;
      case 'bloquear':
        await updateEmployeeStatus(employee.id, 'bloqueado');
        break;
      case 'tornar-proprietario':
        await updateEmployeeRole(employee.id, 'proprietario');
        break;
      case 'tornar-gerente':
        await updateEmployeeRole(employee.id, 'gerente');
        break;
      case 'tornar-vendedor':
        await updateEmployeeRole(employee.id, 'vendedor');
        break;
      case 'excluir':
        setEmployeeToDelete(employee);
        setDeleteDialogOpen(true);
        break;
    }
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      await deleteEmployee(employeeToDelete.id);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'aprovar': return UserCheck;
      case 'bloquear': return UserX;
      case 'tornar-proprietario': return Crown;
      case 'tornar-gerente': return Shield;
      case 'tornar-vendedor': return User;
      case 'excluir': return Trash2;
      default: return User;
    }
  };

  const getActionLabel = (action: string) => {
    const labels = {
      'aprovar': 'Aprovar',
      'bloquear': 'Bloquear',
      'tornar-proprietario': 'Tornar Proprietário',
      'tornar-gerente': 'Tornar Gerente',
      'tornar-vendedor': 'Tornar Vendedor',
      'excluir': 'Excluir',
    };
    return labels[action as keyof typeof labels] || action;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="glass-card p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Users className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Erro ao carregar usuários</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={refetch} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie permissões e status dos usuários do sistema
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
            <Users className="h-8 w-8 text-primary/60" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold text-green-600">
                {employees.filter(e => e.status === 'ativo').length}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600/60" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {employees.filter(e => e.status === 'pendente').length}
              </p>
            </div>
            <User className="h-8 w-8 text-yellow-600/60" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Bloqueados</p>
              <p className="text-2xl font-bold text-red-600">
                {employees.filter(e => e.status === 'bloqueado').length}
              </p>
            </div>
            <UserX className="h-8 w-8 text-red-600/60" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => {
              const availableActions = getAvailableActions(employee);
              
              return (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.nome_completo}
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(employee.role)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(employee.status)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.email}
                  </TableCell>
                  <TableCell>
                    {availableActions.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {availableActions.map((action, index) => {
                            const IconComponent = getActionIcon(action);
                            const isDestructive = action === 'excluir' || action === 'bloquear';
                            
                            return (
                              <div key={action}>
                                {index > 0 && availableActions[index - 1] !== 'excluir' && action === 'excluir' && (
                                  <DropdownMenuSeparator />
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleAction(employee, action)}
                                  className={isDestructive ? 'text-destructive focus:text-destructive' : ''}
                                >
                                  <IconComponent className="mr-2 h-4 w-4" />
                                  {getActionLabel(action)}
                                </DropdownMenuItem>
                              </div>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="w-8" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {employees.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Users className="h-16 w-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Nenhum usuário encontrado</h3>
                <p className="text-muted-foreground">
                  Não há usuários cadastrados no sistema
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{employeeToDelete?.nome_completo}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Gerenciamento;