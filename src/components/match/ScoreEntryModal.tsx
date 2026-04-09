import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { matchService } from "@/services/matchService";
import type { Match } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

interface ScoreEntryModalProps {
  match: Match;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({ match, open, onClose, onSuccess }) => {
  const [scoreA, setScoreA] = useState<string>(match.scoreA?.toString() ?? "");
  const [scoreB, setScoreB] = useState<string>(match.scoreB?.toString() ?? "");
  const isEdit = match.status === "completed";

  const mutation = useMutation({
    mutationFn: () => {
      const a = parseInt(scoreA);
      const b = parseInt(scoreB);
      return isEdit
        ? matchService.editScore(match.id, a, b)
        : matchService.submitScore(match.id, a, b);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Result updated!" : "Result confirmed!");
      onSuccess();
    },
    onError: () => toast.error("Failed to submit score"),
  });

  const aNum = parseInt(scoreA);
  const bNum = parseInt(scoreB);
  const bothFilled = scoreA !== "" && scoreB !== "" && !isNaN(aNum) && !isNaN(bNum);
  const previewWinner = bothFilled
    ? aNum > bNum ? match.teamA?.name : bNum > aNum ? match.teamB?.name : "Draw"
    : null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Result" : "Enter Score"}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="text-sm text-muted-foreground">
            <p>Round {match.round} • Match {match.matchNumber}</p>
            {match.scheduledDate && <p>{new Date(match.scheduledDate).toLocaleDateString()}</p>}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{match.teamA?.name ?? "Team A"}</Label>
              <Input
                type="number"
                min={0}
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                placeholder="Score"
                className="text-center text-lg font-bold"
              />
            </div>
            <div className="text-center text-sm text-muted-foreground font-medium">VS</div>
            <div className="space-y-2">
              <Label>{match.teamB?.name ?? "Team B"}</Label>
              <Input
                type="number"
                min={0}
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                placeholder="Score"
                className="text-center text-lg font-bold"
              />
            </div>
          </div>

          {previewWinner && (
            <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              <span>Winner: <strong>{previewWinner}</strong></span>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!bothFilled || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? "Update Result" : "Confirm Result"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ScoreEntryModal;
