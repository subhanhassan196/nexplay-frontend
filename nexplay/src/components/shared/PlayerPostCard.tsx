import { Heart, MessageCircle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { CommunityPost } from "@/types";

export function PlayerPostCard({ post }: { post: CommunityPost }) {
  return (
    <GlassPanel hoverGlow className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <Avatar name={post.avatarSeed} online />
        <div>
          <p className="text-sm font-medium text-white">{post.author}</p>
          <p className="text-xs text-muted">{post.timeAgo} ago</p>
        </div>
        {post.game && (
          <Badge variant="neutral" className="ml-auto">
            {post.game}
          </Badge>
        )}
      </div>
      <p className="text-sm leading-relaxed text-white/90">{post.content}</p>
      <div className="flex items-center gap-5 border-t border-white/5 pt-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          {post.likes}
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" />
          {post.comments}
        </span>
      </div>
    </GlassPanel>
  );
}
