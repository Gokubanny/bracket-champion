// src/components/spotlight/BlogCard3D.tsx
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Eye, User } from "lucide-react";
import { format } from "date-fns";
import type { BlogPost, SportType } from "@/types/spotlight";
import { SPORTS } from "@/constants/sports";
import SportBadge from "@/components/ui/SportBadge";

interface BlogCard3DProps {
  post: BlogPost;
  index: number;
}

const BlogCard3D: React.FC<BlogCard3DProps> = ({ post, index }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const moveX = e.clientX - centerX;
    const moveY = e.clientY - centerY;
    x.set(moveX);
    y.set(moveY);
  };
  
  const sportConfig = SPORTS[post.sport as keyof typeof SPORTS];
  const glowColor = `hsl(var(${sportConfig?.colorVar ?? "--primary"}) / 0.4)`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
      }}
      onMouseMove={handleMouseMove}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative cursor-pointer"
      onClick={() => navigate(`/spotlight/${post.id}`)}
    >
      <div
        className="glass-card rounded-xl overflow-hidden transition-all duration-300"
        style={{
          boxShadow: isHovered ? `0 25px 40px -12px ${glowColor}` : "none",
          transform: isHovered ? "translateZ(20px)" : "none",
        }}
      >
        {/* Hero Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.heroImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{ transform: isHovered ? "scale(1.08)" : "scale(1)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          
          {/* Featured Badge */}
          {post.featured && (
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-lg">
                FEATURED
              </span>
            </div>
          )}
          
          {/* Sport Badge */}
          <div className="absolute bottom-3 left-3">
            <SportBadge sport={post.sport} />
          </div>
          
          {/* View Count */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] text-white">
            <Eye className="h-3 w-3" />
            {post.viewCount}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {post.excerpt}
          </p>
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{post.author.name.split(" ")[0]}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{post.readTime} min read</span>
            </div>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 pt-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-muted/50 text-[10px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BlogCard3D;