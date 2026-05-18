// src/pages/Spotlight/Admin/ManagePosts.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SAMPLE_BLOG_POSTS } from "@/constants/spotlightData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const ManagePosts = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  
  const filteredPosts = SAMPLE_BLOG_POSTS.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase())
  );
  
  const handleDelete = (id: string) => {
    toast.success("Post deleted (demo mode)");
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Spotlight Articles</h1>
          <p className="text-muted-foreground text-sm">Create, edit, or remove blog posts</p>
        </div>
        <Button onClick={() => navigate("/admin/spotlight/create")}>
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </Button>
      </div>
      
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{post.sport}</Badge>
                </TableCell>
                <TableCell>{format(new Date(post.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell>{post.viewCount}</TableCell>
                <TableCell>
                  {post.featured && <Badge className="bg-primary">Featured</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/spotlight/${post.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ManagePosts;