import { useState } from 'react';
import { UserX, UserCheck, Trash2, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';
import { useAuthContext } from '@/context/AuthContext';
import { User, UserRole } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-red-100 text-red-700 border-red-200' },
  technician: { label: 'Technician', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  user: { label: 'User', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-green-500',
  'bg-amber-500', 'bg-rose-500', 'bg-teal-500',
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'technician', 'user']),
});
type CreateUserForm = z.infer<typeof createUserSchema>;

function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'user' },
  });

  const selectedRole = watch('role');

  const create = useMutation({
    mutationFn: (data: CreateUserForm) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      reset();
      onClose();
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? 'Failed to create user'),
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="new-name">Full Name *</Label>
            <Input id="new-name" placeholder="John Smith" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-email">Email *</Label>
            <Input id="new-email" type="email" placeholder="john@company.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password *</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                {...register('password')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Role *</Label>
            <Select value={selectedRole} onValueChange={(v) => setValue('role', v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="technician">Technician</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthContext();
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated');
    },
    onError: () => toast.error('Failed to update role'),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Failed to deactivate'),
  });

  const activate = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User activated');
    },
    onError: () => toast.error('Failed to activate user'),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
      setDeletingId(null);
    },
    onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Failed to delete user'),
  });

  const handleDeleteConfirm = (id: string) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    deleteUser.mutate(id);
  };

  const users: User[] = data?.data ?? [];

  // Role summary counts
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const techCount = users.filter((u) => u.role === 'technician').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle={`${data?.total ?? 0} registered accounts`}
        action={
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        }
      />

      {/* Role summary chips */}
      {!isLoading && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-sm text-slate-600">Admins</span>
            <span className="text-sm font-bold">{adminCount}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-sm text-slate-600">Technicians</span>
            <span className="text-sm font-bold">{techCount}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-sm text-slate-600">Users</span>
            <span className="text-sm font-bold">{userCount}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div
                key={user._id}
                className={cn(
                  'rounded-xl border bg-white p-4 shadow-sm transition-opacity',
                  !user.isActive && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className={cn('text-white text-sm font-semibold', getAvatarColor(user.name))}>
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-fixflow-muted truncate">{user.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 text-xs', ROLE_BADGE[user.role]?.className)}
                  >
                    {ROLE_BADGE[user.role]?.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Select
                    defaultValue={user.role}
                    onValueChange={(role) => updateRole.mutate({ id: user._id, role })}
                  >
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    {user.isActive ? (
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-fixflow-muted hover:text-amber-600"
                        onClick={() => deactivate.mutate(user._id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-fixflow-muted hover:text-green-600"
                        onClick={() => activate.mutate(user._id)}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                    {user._id !== currentUser?._id && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-fixflow-muted hover:text-destructive"
                        onClick={() => handleDeleteConfirm(user._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">User</TableHead>
                  <TableHead className="font-semibold text-slate-700">Role</TableHead>
                  <TableHead className="font-semibold text-slate-700 w-24">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Joined</TableHead>
                  <TableHead className="font-semibold text-slate-700 w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user._id}
                    className={cn('group transition-colors', !user.isActive && 'opacity-50')}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className={cn('text-white text-xs font-semibold', getAvatarColor(user.name))}>
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-fixflow-muted">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(role) => updateRole.mutate({ id: user._id, role })}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="technician">Technician</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
                          user.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        )}
                      >
                        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', user.isActive ? 'bg-green-500' : 'bg-slate-400')} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-fixflow-muted">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.isActive ? (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-fixflow-muted hover:text-amber-600"
                            title="Deactivate"
                            onClick={() => deactivate.mutate(user._id)}
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-fixflow-muted hover:text-green-600"
                            title="Activate"
                            onClick={() => activate.mutate(user._id)}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {user._id !== currentUser?._id && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-fixflow-muted hover:text-destructive"
                            title="Delete user"
                            onClick={() => handleDeleteConfirm(user._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <AddUserDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
