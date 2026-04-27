import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { tournamentService } from "@/services/tournamentService";
import { teamService } from "@/services/teamService";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import SportBadge from "@/components/ui/SportBadge";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Image, Loader2, Plus, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const JoinTournament = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament-join", inviteCode],
    queryFn: () => tournamentService.getByInviteCode(inviteCode!),
    enabled: !!inviteCode,
  });

  const sportConfig = tournament ? SPORTS[tournament.sport as SportType] : undefined;

  const schema = z.object({
    teamName: z.string().min(2, "Team name must be at least 2 characters").max(50),
    color: z.string().min(1, "Pick a team color"),
    repName: z.string().min(2, "Name must be at least 2 characters").max(100),
    repEmail: z.string().email("Invalid email"),
    repPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    players: z.array(z.object({
      name: z.string().min(1, "Player name required"),
      jerseyNumber: z.coerce.number().min(0, "Invalid number"),
      position: z.string().min(1, "Position required"),
    })).min(sportConfig?.minSquad ?? 1, `Minimum ${sportConfig?.minSquad ?? 1} players required`),
  }).refine(d => d.repPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      teamName: "",
      color: "#3B82F6",
      repName: "",
      repEmail: "",
      repPassword: "",
      confirmPassword: "",
      players: [{ name: "", jerseyNumber: 1, position: "" }],
    },
  });

  const players = form.watch("players");

  const addPlayer = () => {
    const current = form.getValues("players");
    form.setValue("players", [...current, { name: "", jerseyNumber: current.length + 1, position: "" }]);
  };

  const removePlayer = (index: number) => {
    const current = form.getValues("players");
    if (current.length > 1) {
      form.setValue("players", current.filter((_, i) => i !== index));
    }
  };

  const registerMutation = useMutation({
    mutationFn: (data: FormData) =>
      teamService.registerTeam(inviteCode!, {
        teamName: data.teamName,
        color: data.color,
        logo: logo || undefined,
        repName: data.repName,
        repEmail: data.repEmail,
        repPassword: data.repPassword,
        players: data.players as Omit<import("@/types").Player, "id" | "teamId">[],
      }),
    onSuccess: () => {
      setSuccess(true);
      toast.success("Registration submitted!");
    },
    onError: () => toast.error("Registration failed. Please try again."),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const valid = await form.trigger(["teamName", "color"]);
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await form.trigger(["repName", "repEmail", "repPassword", "confirmPassword"]);
      if (valid) setStep(3);
    }
  };

  const onSubmit = (data: FormData) => registerMutation.mutate(data);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState icon={<Trophy className="h-8 w-8" />} title="Tournament not found" description="This invite link may be invalid." />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 animate-fade-in">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mb-2">
              <Check className="h-8 w-8 text-success" />
            </div>
            <CardTitle>Registration Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Your team registration for <strong>{tournament.name}</strong> has been submitted. You'll receive approval from the tournament admin.
            </p>
            <p className="text-xs text-muted-foreground">Awaiting admin approval.</p>
            <Button onClick={() => navigate(`/tournament/${inviteCode}`)}>
              View Tournament
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <SportBadge sport={tournament.sport as SportType} />
          <span className="text-sm text-muted-foreground">{tournament.name}</span>
        </div>
        <h1 className="text-2xl font-bold">Team Registration</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="glass-card">
                  <CardHeader><CardTitle>Team Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="teamName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl><Input placeholder="Your awesome team" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="color" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Color</FormLabel>
                        <div className="flex items-center gap-3">
                          <input type="color" value={field.value} onChange={field.onChange} className="h-10 w-10 rounded cursor-pointer border-0" />
                          <FormControl><Input {...field} className="w-32" /></FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div>
                      <FormLabel>Team Logo (optional)</FormLabel>
                      <div className="mt-2">
                        {logoPreview ? (
                          <div className="relative w-24 h-24">
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                            <Button size="sm" variant="secondary" className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full" onClick={() => { setLogo(null); setLogoPreview(null); }}>×</Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-24 w-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                            <Image className="h-6 w-6 text-muted-foreground" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                          </label>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="glass-card">
                  <CardHeader><CardTitle>Team Representative</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="repName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="repEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="repPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Squad ({players.length} players)</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        Min: {sportConfig?.minSquad} / Max: {sportConfig?.maxSquad}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {players.map((_, index) => (
                      <div key={index} className="flex items-start gap-2 bg-muted/30 rounded-lg p-3">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Player name"
                            value={form.watch(`players.${index}.name`)}
                            onChange={(e) => form.setValue(`players.${index}.name`, e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="#"
                              className="w-16"
                              value={form.watch(`players.${index}.jerseyNumber`) || ""}
                              onChange={(e) => form.setValue(`players.${index}.jerseyNumber`, parseInt(e.target.value) || 0)}
                            />
                            {sportConfig ? (
                              <Select
                                value={form.watch(`players.${index}.position`)}
                                onValueChange={(v) => form.setValue(`players.${index}.position`, v)}
                              >
                                <SelectTrigger className="flex-1"><SelectValue placeholder="Position" /></SelectTrigger>
                                <SelectContent>
                                  {sportConfig.positions.map((pos) => (
                                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input placeholder="Position" className="flex-1" value={form.watch(`players.${index}.position`)} onChange={(e) => form.setValue(`players.${index}.position`, e.target.value)} />
                            )}
                          </div>
                        </div>
                        {players.length > 1 && (
                          <Button type="button" size="icon" variant="ghost" className="text-destructive shrink-0 mt-1" onClick={() => removePlayer(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {form.formState.errors.players?.root && (
                      <p className="text-sm text-destructive">{form.formState.errors.players.root.message}</p>
                    )}
                    {players.length < (sportConfig?.maxSquad ?? 30) && (
                      <Button type="button" variant="outline" size="sm" onClick={addPlayer} className="w-full">
                        <Plus className="h-4 w-4 mr-1" /> Add Player
                      </Button>
                    )}

                    {/* Summary */}
                    <div className="rounded-lg border border-border p-4 mt-4 space-y-2">
                      <h4 className="font-medium text-sm">Summary</h4>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        <span className="text-muted-foreground">Team:</span><span>{form.watch("teamName") || "—"}</span>
                        <span className="text-muted-foreground">Rep:</span><span>{form.watch("repName") || "—"}</span>
                        <span className="text-muted-foreground">Email:</span><span>{form.watch("repEmail") || "—"}</span>
                        <span className="text-muted-foreground">Players:</span><span>{players.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : <div />}
            {step < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit Registration
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default JoinTournament;