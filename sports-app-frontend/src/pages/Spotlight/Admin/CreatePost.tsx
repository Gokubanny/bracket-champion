// src/pages/Spotlight/Admin/CreatePost.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SportType } from "@/types/spotlight";
import { PLAYER_IMAGES } from "@/constants/spotlightImages";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  excerpt: z.string().min(20, "Excerpt must be at least 20 characters").max(200),
  content: z.string().min(100, "Content must be at least 100 characters"),
  sport: z.enum(["football", "basketball", "tennis", "volleyball", "cricket", "badminton"]),
  heroImage: z.string().url("Must be a valid image URL"),
  playerImage: z.string().url("Must be a valid image URL").optional(),
  tags: z.string().transform(val => val.split(",").map(t => t.trim()).filter(Boolean)),
  featured: z.boolean().default(false),
});

type PostFormData = z.infer<typeof postSchema>;

const CreatePost = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewHero, setPreviewHero] = useState<string | null>(null);
  const [previewPlayer, setPreviewPlayer] = useState<string | null>(null);
  
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      sport: "football",
      heroImage: "",
      playerImage: "",
      tags: "",
      featured: false,
    },
  });
  
  const selectedSport = form.watch("sport");
  
  const handleHeroImageUrl = (url: string) => {
    form.setValue("heroImage", url);
    setPreviewHero(url);
  };
  
  const handlePlayerImageUrl = (url: string) => {
    form.setValue("playerImage", url);
    setPreviewPlayer(url);
  };
  
  const useSampleImage = (type: "hero" | "player") => {
    const sport = selectedSport;
    if (type === "hero") {
      const url = PLAYER_IMAGES[sport as keyof typeof PLAYER_IMAGES]?.hero;
      if (url) handleHeroImageUrl(url);
    } else {
      const url = PLAYER_IMAGES[sport as keyof typeof PLAYER_IMAGES]?.player;
      if (url) handlePlayerImageUrl(url);
    }
  };
  
  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Post data:", {
      ...data,
      tags: data.tags,
      author: { id: "admin", name: "Current Admin" },
      createdAt: new Date().toISOString(),
    });
    
    toast.success("Post created successfully!");
    navigate("/spotlight");
    setIsSubmitting(false);
  };
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Spotlight Article</h1>
          <p className="text-muted-foreground text-sm">Share stories, analysis, and highlights</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/spotlight")}>
          Cancel
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Article Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter catchy title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt / Summary</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief summary that appears on the card..."
                            className="resize-none h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Article Content (HTML supported)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write your article here... You can use HTML tags for formatting"
                            className="resize-none h-64 font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="football, tournament, interview" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Use Cloudinary URLs or any image URLs. Sample images available for each sport.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hero Image */}
                  <div className="space-y-3">
                    <FormLabel>Hero / Cover Image</FormLabel>
                    <div className="flex gap-3">
                      <FormField
                        control={form.control}
                        name="heroImage"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="outline" onClick={() => useSampleImage("hero")}>
                        <ImagePlus className="h-4 w-4 mr-1" />
                        Sample
                      </Button>
                    </div>
                    {previewHero && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden mt-2">
                        <img src={previewHero} alt="Hero preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setPreviewHero(null); form.setValue("heroImage", ""); }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Player Image (for 3D effect) */}
                  <div className="space-y-3">
                    <FormLabel>Player Portrait (Optional)</FormLabel>
                    <div className="flex gap-3">
                      <FormField
                        control={form.control}
                        name="playerImage"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="outline" onClick={() => useSampleImage("player")}>
                        <ImagePlus className="h-4 w-4 mr-1" />
                        Sample
                      </Button>
                    </div>
                    {previewPlayer && (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden mt-2">
                        <img src={previewPlayer} alt="Player preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Post Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="football">⚽ Football</SelectItem>
                            <SelectItem value="basketball">🏀 Basketball</SelectItem>
                            <SelectItem value="tennis">🎾 Tennis</SelectItem>
                            <SelectItem value="volleyball">🏐 Volleyball</SelectItem>
                            <SelectItem value="cricket">🏏 Cricket</SelectItem>
                            <SelectItem value="badminton">🏸 Badminton</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Feature this article</FormLabel>
                          <p className="text-xs text-muted-foreground">Appears in featured section on homepage</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 border-t border-border">
                    <Badge variant="outline" className="text-xs">
                      Article will be published immediately
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/spotlight")}>
              Preview
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Publish Article
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreatePost;