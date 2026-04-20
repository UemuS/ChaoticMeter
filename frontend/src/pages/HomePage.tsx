import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreatePostForm from "../components/CreatePostForm";
import Navbar from "../components/Navbar";
import PostList from "../components/PostList";
import PostListItem from "../components/PostListItem";
import { createPost, getPosts } from "../services/api";
import type { Post } from "../types";

const PAGE_SIZE = 20;

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);
  const [sort, setSort] = useState<"new" | "top">("new");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [postsError, setPostsError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getPosts({ sort: "top" }).then((data) => setTrending(data.slice(0, 3))).catch(() => {});
  }, []);

  useEffect(() => {
    loadPosts(sort, search);
  }, [sort, search]);

  async function loadPosts(currentSort: "new" | "top", currentSearch: string) {
    setPostsError(false);
    try {
      const data = await getPosts({ sort: currentSort, search: currentSearch, offset: 0 });
      setPosts(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setPostsError(true);
      setPosts([]);
      setHasMore(false);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await getPosts({ sort, search, offset: posts.length });
      setPosts((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      // silently fail — existing posts stay visible
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleCreatePost(title: string, body: string) {
    const post = await createPost(title, body);
    navigate(`/posts/${post.slug}`);
  }

  function handleNewPostClick() {
    const element = document.getElementById("create-post");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSearchSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  return (
    <>
      <Navbar onNewPostClick={handleNewPostClick} />

      <main className="page-shell">
        <div className="page-container">
          <CreatePostForm onSubmit={handleCreatePost} />

          {trending.length > 0 && (
            <section className="trending-section">
              <h2 className="trending-title">Trending</h2>
              <div className="post-list">
                {trending.map((post, i) => (
                  <PostListItem key={post.slug} post={post} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          <section className="post-controls">
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <input
                className="search-input"
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title..."
              />
              <button type="submit" className="secondary-button">
                Search
              </button>
            </form>

            <div className="sort-group">
              <label htmlFor="sort" className="sort-label">
                Sort
              </label>
              <select
                id="sort"
                className="sort-select"
                value={sort}
                onChange={(event) => setSort(event.target.value as "new" | "top")}
              >
                <option value="new">Newest</option>
                <option value="top">Most votes</option>
              </select>
            </div>
          </section>

          {postsError ? (
            <div className="error-state">
              <p className="error-title">Couldn't load posts.</p>
              <p className="error-hint">The server might be down. Try again in a moment.</p>
              <button className="primary-button" onClick={() => loadPosts(sort, search)}>Retry</button>
            </div>
          ) : (
            <>
              <PostList posts={posts} search={search} />
              {hasMore && (
                <div className="load-more-wrap">
                  <button className="secondary-button" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
