import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2, Mail, Phone, Building2, Clock, Shield, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/context/AuthContext';
import { usersApi } from '@/api/users.api';
import { ticketsApi } from '@/api/tickets.api';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  department: z.string().optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  ASSIGNED: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  ON_HOLD: 'bg-gray-100 text-gray-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  technician: 'bg-amber-100 text-amber-700',
  user: 'bg-blue-100 text-blue-700',
};

export function ProfilePage() {
  const { user, setUser } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);

  const { data: recentTickets } = useQuery({
    queryKey: ['profile-tickets'],
    queryFn: () => ticketsApi.list({ limit: 5 }),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      department: user?.department ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      department: user?.department ?? '',
    });
  }, [user, reset]);

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: (data: ProfileFormData) => usersApi.update(user!._id, data),
    onSuccess: (res) => {
      if (res.data) setUser(res.data);
      toast.success('Profile updated');
      setIsEditing(false);
    },
    onError: () => toast.error('Failed to update profile'),
  });

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-semibold">My Profile</h1>

      {/* Profile Info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-fixflow-primary text-xl font-bold text-white">
                {initials}
              </div>
              <div>
                <p className="text-lg font-semibold">{user.name}</p>
                <span className={`inline-flex mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_COLORS[user.role]}`}>
                  {user.role}
                </span>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit((d) => saveProfile(d))} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" placeholder="Facilities" {...register('department')} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { reset(); setIsEditing(false); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="font-medium">{user.email}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{user.phone || '—'}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Department</dt>
                  <dd className="font-medium">{user.department || '—'}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Member Since</dt>
                  <dd className="font-medium">{memberSince}</dd>
                </div>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Account Info
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account Status</p>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account ID</p>
            <p className="font-mono text-xs text-muted-foreground break-all">{user._id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Recent Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentTickets?.data?.length ? (
            <p className="text-sm text-muted-foreground py-2">No tickets yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentTickets.data.slice(0, 5).map((ticket) => (
                <li key={ticket._id} className="py-3 flex items-center justify-between gap-3">
                  <Link
                    to={`/tickets/${ticket._id}`}
                    className="min-w-0 flex-1 hover:underline"
                  >
                    <p className="text-sm font-medium truncate">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground">{ticket.ticketNumber}</p>
                  </Link>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
