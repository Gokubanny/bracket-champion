import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { tournamentService } from "@/services/tournamentService";
import { SPORT_OPTIONS, TEAM_SLOT_OPTIONS } from "@/constants/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ArrowLeft, ArrowRight, Check, Copy, Image } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  sport: z.string().min(1, "Select a sport"),
  description: z.string().max(500).optional(),
  teamSlots: z.number().min(4),
  startDate: z.date({ required_error: "Start date is required" }),
  registrationDeadline: z.date({ required_error: "Registration deadline is required" }),
  estimatedMatchDuration: z.number().optional(),
  visibility: z.enum(["public", "private"]),
}).refine(data => data.registrationDeadline < data.startDate, {
  message: "Registration deadline must be before start date",
  path: ["registrationDeadline"],
});

type FormData = z.infer<typeof schema>;

const CreateTournament = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sport: "",
      description: "",
      teamSlots: 8,
      visibility: "public",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      tournamentService.create({
        ...data,
        sport: data.sport,
        startDate: data.startDate.toISOString(),
        registrationDeadline: data.registrationDeadline.toISOString(),
        banner: banner || undefined,
      }),
    onSuccess: (tournament) => {
      setInviteCode(tournament.inviteCode);
      toast.success("Tournament created successfully!");
    },
    onError: () => toast.error("Failed to create tournament"),
  });

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBanner(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const valid = await form.trigger(["name", "sport"]);
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await form.trigger(["teamSlots", "startDate", "registrationDeadline"]);
      if (valid) setStep(3);
    }
  };

  const onSubmit = (data: FormData) => createMutation.mutate(data);

  const copyInviteLink = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(`${window.location.origin}/tournament/${inviteCode}`);
      toast.success("Invite link copied!");
    }
  };

  if (inviteCode) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mb-2">
              <Check className="h-8 w-8 text-success" />
            </div>
            <CardTitle>Tournament Created!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <code className="text-sm flex-1 truncate">
                {window.location.origin}/tournament/{inviteCode}
              </code>
              <Button size="sm" variant="ghost" onClick={copyInviteLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => navigate("/admin/tournaments")}>
                View All Tournaments
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/admin/tournaments/create")}>
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Create Tournament</h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {s}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {s === 1 ? "Basic Info" : s === 2 ? "Structure" : "Review"}
            </span>
            {s < 3 && <div className={cn("h-0.5 flex-1", s < step ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="glass-card">
                  <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tournament Name</FormLabel>
                        <FormControl><Input placeholder="Spring Championship 2024" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sport" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a sport" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SPORT_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl><Textarea placeholder="Describe your tournament..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div>
                      <FormLabel>Banner Image (optional)</FormLabel>
                      <div className="mt-2">
                        {bannerPreview ? (
                          <div className="relative rounded-lg overflow-hidden">
                            <img src={bannerPreview} alt="Banner" className="w-full h-40 object-cover" />
                            <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={() => { setBanner(null); setBannerPreview(null); }}>
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                            <Image className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
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
                  <CardHeader><CardTitle>Structure Settings</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="teamSlots" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Team Slots</FormLabel>
                        <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TEAM_SLOT_OPTIONS.map((n) => (
                              <SelectItem key={n} value={String(n)}>{n} Teams</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="registrationDeadline" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Registration Deadline</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="estimatedMatchDuration" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Match Duration (minutes, optional)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="90" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
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
                  <CardHeader><CardTitle>Visibility & Review</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <FormField control={form.control} name="visibility" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div>
                          <FormLabel className="text-base">Public Tournament</FormLabel>
                          <p className="text-sm text-muted-foreground">Anyone with the link can view</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value === "public"} onCheckedChange={(checked) => field.onChange(checked ? "public" : "private")} />
                        </FormControl>
                      </FormItem>
                    )} />

                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <h4 className="font-medium">Summary</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{form.watch("name") || "—"}</span>
                        <span className="text-muted-foreground">Sport:</span>
                        <span className="capitalize">{form.watch("sport") || "—"}</span>
                        <span className="text-muted-foreground">Team Slots:</span>
                        <span>{form.watch("teamSlots")}</span>
                        <span className="text-muted-foreground">Start Date:</span>
                        <span>{form.watch("startDate") ? format(form.watch("startDate"), "PPP") : "—"}</span>
                        <span className="text-muted-foreground">Deadline:</span>
                        <span>{form.watch("registrationDeadline") ? format(form.watch("registrationDeadline"), "PPP") : "—"}</span>
                        <span className="text-muted-foreground">Visibility:</span>
                        <span className="capitalize">{form.watch("visibility")}</span>
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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Tournament
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateTournament;
