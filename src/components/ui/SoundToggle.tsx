import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSound } from "@/context/SoundContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SoundToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { muted, toggleMute, play } = useSound();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
          aria-pressed={!muted}
          onClick={() => {
            const nextMuted = !muted;
            toggleMute();
            // Play a confirmation chirp when turning sound back ON
            if (!nextMuted) setTimeout(() => play("click"), 50);
          }}
        >
          {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-primary" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{muted ? "Sound off" : "Sound on"}</TooltipContent>
    </Tooltip>
  );
};

export default SoundToggle;
