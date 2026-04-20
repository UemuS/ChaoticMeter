import { Link } from "react-router-dom";
import type { Post } from "../types";

type PostListItemProps = {
  post: Post;
  rank?: number;
};

function formatPostDate(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  }

  return created.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PostListItem({ post, rank }: PostListItemProps) {
  return (
    <Link to={`/posts/${post.slug}`} className={`post-list-item${rank !== undefined ? ` rank-${rank}` : ""}`}>
      <div className="post-list-item-meta-row">
        <span className="post-list-item-date">
          {formatPostDate(post.created_at)}
        </span>
      </div>

      <div className="post-list-item-content">

        <div className="post-list-item-main">
          <h3 className="post-list-item-title">{post.title}</h3>

          {post.body ? (
            <p className="post-list-item-body">{post.body}</p>
          ) : null}
        </div>

        <div className="post-list-item-votes">
          {post.vote_count} vote{post.vote_count !== 1 ? "s" : ""}
        </div>
      </div>
    </Link>
  );
}