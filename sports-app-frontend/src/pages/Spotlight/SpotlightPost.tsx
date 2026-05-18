// src/pages/Spotlight/SpotlightPost.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Eye, User, Tag, Heart, Share2, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CommentsSection from "@/components/spotlight/CommentsSection";
import StadiumScene from "@/components/spotlight/StadiumScene";
import { SAMPLE_BLOG_POSTS } from "@/constants/spotlightData";
import type { BlogPost, Comment } from "@/types/spotlight";
import { format } from "date-fns";
import { toast } from "sonner";

const SpotlightPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  
  useEffect(() => {
    // Simulate API fetch
    const found = SAMPLE_BLOG_POSTS.find(p => p.id === id);
    setPost(found || null);
    setLoading(false);
  }, [id]);
  
  const handleAddComment = async (content: string) => {
    if (!user || !post) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      postId: post.id,
      userId: user.id,
      userName: user.fullName,
      userAvatar: user.avatar,
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    
    setPost({
      ...post,
      comments: [...post.comments, newComment],
    });
    toast.success("Comment posted!");
  };
  
  const handleLikeComment = async (commentId: string) => {
    if (!post) return;
    setPost({
      ...post,
      comments: post.comments.map(c =>
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c
      ),
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen">
        <StadiumScene />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full rounded-xl mb-6" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Article not found</h2>
          <p className="text-muted-foreground mb-4">The spotlight you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/spotlight")}>Back to Spotlight</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen relative">
      <StadiumScene sport={post.sport} />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <img
            src={post.heroImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/spotlight")}
            className="absolute top-4 left-4 gap-1 bg-background/80 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          {/* Post Meta Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-4 bg-primary/90">
                {post.sport.toUpperCase()}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {post.author.avatar && <AvatarImage src={post.author.avatar} />}
                    <AvatarFallback>{post.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{post.author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.createdAt), "MMMM d, yyyy")}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime} min read
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.viewCount} views
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Action Bar */}
          <div className="flex items-center justify-between border-b border-border pb-4 mb-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${liked ? "text-red-500" : ""}`}
                onClick={() => setLiked(!liked)}
              >
                <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
                Like
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <BookmarkPlus className="h-4 w-4" />
                Save
              </Button>
            </div>
            <div className="flex gap-2">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Article Body */}
          <div
            className="prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          
          {/* Author Bio */}
          <div className="mt-12 p-6 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                {post.author.avatar && <AvatarImage src={post.author.avatar} />}
                <AvatarFallback className="bg-primary/20 text-primary">
                  {post.author.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">
                  Sports journalist covering student athletics and emerging talent.
                </p>
              </div>
            </div>
          </div>
          
          {/* Comments Section */}
          <div className="mt-12">
            <CommentsSection
              comments={post.comments}
              postId={post.id}
              onAddComment={handleAddComment}
              onLikeComment={handleLikeComment}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotlightPost;