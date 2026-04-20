import type { Post } from "../types";
import PostListItem from "./PostListItem";

type PostListProps = {
  posts: Post[];
  search?: string;
};

export default function PostList({ posts, search }: PostListProps) {
  return (
    <section className="post-list-section">
      <div className="section-heading section-heading-row">
        <h2 className="section-title">Recent posts</h2>
        <p className="section-subtitle">
          {posts.length} post{posts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>{search?.trim() ? `Nothing matched "${search}". The compass has no opinion on that.` : "No posts yet. Be the first to create one."}</p>
        </div>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}