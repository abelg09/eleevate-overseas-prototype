import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Users, PlusCircle, Mail, Shield, UserCheck, Trash2, Clock, CheckCircle2 } from "lucide-react";

type TeamRole = "admin" | "senior_counsellor" | "junior_counsellor";
type MemberStatus = "pending" | "active" | "removed";

interface TeamMember {
  id: string;
  consultantId: string;
  inviteEmail: string;
  memberUserId?: string;
  role: TeamRole;
  status: MemberStatus;
  createdAt: string;
}

const ROLE_CONFIG: Record<TeamRole, { label: string; color: string; icon: typeof Shield; description: string }> = {
  admin: { label: "Admin", color: "bg-red-100 text-red-700", icon: Shield, description: "Full access to all features and settings" },
  senior_counsellor: { label: "Senior Counsellor", color: "bg-blue-100 text-blue-700", icon: UserCheck, description: "Manage clients, leads, and sessions" },
  junior_counsellor: { label: "Junior Counsellor", color: "bg-green-100 text-green-700", icon: Users, description: "View clients and sessions, limited editing" },
};

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Invite sent", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  active: { label: "Active", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  removed: { label: "Removed", color: "bg-gray-100 text-gray-500", icon: Trash2 },
};

async function fetchTeam(): Promise<{ data: TeamMember[]; total: number }> {
  const res = await fetch("/api/consultant/team");
  if (!res.ok) throw new Error("Failed to fetch team");
  return res.json();
}

async function inviteMember(data: { inviteEmail: string; role: TeamRole }): Promise<TeamMember> {
  const res = await fetch("/api/consultant/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to invite member");
  return res.json();
}

async function updateMember(id: string, data: Partial<TeamMember>): Promise<TeamMember> {
  const res = await fetch(`/api/consultant/team/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update member");
  return res.json();
}

async function removeMember(id: string): Promise<void> {
  const res = await fetch(`/api/consultant/team/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove member");
}

function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("junior_counsellor");
  const { toast } = useToast();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: inviteMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/consultant/team"] });
      setOpen(false);
      setEmail("");
      toast({ title: "Invite sent!", description: `Invitation sent to ${email}` });
    },
    onError: () => toast({ title: "Error", description: "Failed to send invite", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="btn-invite-member"><PlusCircle className="mr-2 h-4 w-4" /> Invite member</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="mb-1.5">Email address *</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@agency.com" type="email" data-testid="input-invite-email" />
          </div>
          <div>
            <Label className="mb-2 block">Role</Label>
            <div className="space-y-2">
              {(Object.entries(ROLE_CONFIG) as [TeamRole, typeof ROLE_CONFIG[TeamRole]][]).map(([k, v]) => {
                const Icon = v.icon;
                return (
                  <button key={k} onClick={() => setRole(k)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${role === k ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <div className={`p-1.5 rounded ${v.color} mt-0.5`}><Icon className="h-3.5 w-3.5" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{v.label}</p>
                      <p className="text-xs text-muted-foreground">{v.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <Button className="w-full" onClick={() => mut.mutate({ inviteEmail: email, role })} disabled={!email || mut.isPending} data-testid="btn-submit-invite">
            {mut.isPending ? "Sending..." : "Send invite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const PERMISSIONS: Record<TeamRole, { feature: string; canDo: boolean }[]> = {
  admin: [
    { feature: "View & manage all clients", canDo: true },
    { feature: "Add / remove team members", canDo: true },
    { feature: "Edit branding settings", canDo: true },
    { feature: "Manage partner accounts", canDo: true },
    { feature: "View analytics", canDo: true },
  ],
  senior_counsellor: [
    { feature: "View & manage all clients", canDo: true },
    { feature: "Add / remove team members", canDo: false },
    { feature: "Edit branding settings", canDo: false },
    { feature: "Manage partner accounts", canDo: true },
    { feature: "View analytics", canDo: true },
  ],
  junior_counsellor: [
    { feature: "View & manage all clients", canDo: false },
    { feature: "Add / remove team members", canDo: false },
    { feature: "Edit branding settings", canDo: false },
    { feature: "Manage partner accounts", canDo: false },
    { feature: "View analytics", canDo: false },
  ],
};

export default function TeamPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/consultant/team"],
    queryFn: fetchTeam,
  });

  const removeMut = useMutation({
    mutationFn: removeMember,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/consultant/team"] }); toast({ title: "Member removed" }); },
  });

  const updateRoleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: TeamRole }) => updateMember(id, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/consultant/team"] }); toast({ title: "Role updated" }); },
  });

  const members = data?.data ?? [];

  return (
    <AppLayout>
      <div data-testid="team-page">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Team Management</h1>
            <p className="text-muted-foreground mt-1">Invite and manage your agency team members.</p>
          </div>
          <InviteDialog />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : members.length > 0 ? (
              <div className="space-y-3">
                {members.map(member => {
                  const roleConfig = ROLE_CONFIG[member.role];
                  const statusConfig = STATUS_CONFIG[member.status];
                  const RoleIcon = roleConfig.icon;
                  const StatusIcon = statusConfig.icon;
                  return (
                    <Card key={member.id} className="border border-border p-4" data-testid={`member-${member.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{member.inviteEmail[0].toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-foreground truncate">{member.inviteEmail}</p>
                            <Badge className={`text-xs ${statusConfig.color} flex-shrink-0`}>
                              <StatusIcon className="h-3 w-3 mr-1" />{statusConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${roleConfig.color}`}><RoleIcon className="h-3 w-3 mr-1" />{roleConfig.label}</Badge>
                            <span className="text-xs text-muted-foreground">Added {new Date(member.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <select value={member.role} onChange={e => updateRoleMut.mutate({ id: member.id, role: e.target.value as TeamRole })}
                            className="text-xs border border-input rounded px-2 py-1 bg-background"
                            data-testid={`role-select-${member.id}`}
                          >
                            <option value="admin">Admin</option>
                            <option value="senior_counsellor">Senior</option>
                            <option value="junior_counsellor">Junior</option>
                          </select>
                          <Button variant="ghost" size="sm" className="text-red-600 h-8 w-8 p-0" onClick={() => removeMut.mutate(member.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border border-border p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No team members yet</h3>
                <p className="text-muted-foreground mb-6">Invite team members to collaborate on client cases.</p>
              </Card>
            )}
          </div>

          <div>
            <Card className="border border-border p-4">
              <h3 className="font-semibold text-foreground mb-4">Role permissions</h3>
              <div className="space-y-5">
                {(Object.entries(ROLE_CONFIG) as [TeamRole, typeof ROLE_CONFIG[TeamRole]][]).map(([role, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={role}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs ${config.color}`}><Icon className="h-3 w-3 mr-1" />{config.label}</Badge>
                      </div>
                      <ul className="space-y-1">
                        {PERMISSIONS[role].map(p => (
                          <li key={p.feature} className="flex items-center gap-2 text-xs">
                            {p.canDo
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                              : <div className="h-3.5 w-3.5 rounded-full border border-gray-300 flex-shrink-0" />}
                            <span className={p.canDo ? "text-foreground" : "text-muted-foreground"}>{p.feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
