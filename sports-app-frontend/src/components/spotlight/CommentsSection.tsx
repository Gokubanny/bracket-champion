// src/components/spotlight/CommentsSection.tsx
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Heart, Loader2 } from "lucide-react";
import type { Comment } from "@/types/spotlight";
import { formatDistanceToNow } from "date-fns";

interface CommentsSectionProps {
  comments: Comment[];
  postId: string;
  onAddComment: (content: string) => Promise<void>;
  onLikeComment: (commentId: string) => Promise<void>;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  postId,
  onAddComment,
  onLikeComment,
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    await onAddComment(newComment);
    setNewComment("");
    setIsSubmitting(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">
          Comments ({comments.length})
        </h3>
      </div>
      
      {/* Add Comment */}
      {user ? (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {user.fullName?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Post Comment
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Sign in to join the conversation
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = "/login"}>
            Login to Comment
          </Button>
        </div>
      )}
      
      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
        
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/20">
            <Avatar className="h-8 w-8">
              {comment.userAvatar && <AvatarImage src={comment.userAvatar} />}
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {comment.userName?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{comment.userName}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
              <button
                onClick={() => onLikeComment(comment.id)}
                className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-red-400 transition-colors"
              >
                <Heart className="h-3 w-3" />
                <span>{comment.likes} likes</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentsSection;