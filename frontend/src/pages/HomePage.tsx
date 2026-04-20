import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreatePostForm from "../components/CreatePostForm";
import Navbar from "../components/Navbar";
import PostList from "../components/PostList";
import PostListItem from "../components/PostListItem";
import { createPost, getPosts } from "../services/api";
import type { Post } from "../types";

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);
  const [sort, setSort] = useState<"new" | "top">("new");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getPosts({ sort: "top" }).then((data) => setTrending(data.slice(0, 3)));
  }, []);

  useEffect(() => {
    loadPosts(sort, search);
  }, [sort, search]);

  async function loadPosts(currentSort: "new" | "top", currentSearch: string) {
    const data = await getPosts({
      sort: currentSort,
      search: currentSearch,
    });
    setPosts(data);
  }

  async function handleCreatePost(title: string, body: string) {
    const post = await createPost(title, body);
    navigate(`/posts/${post.slug}`);
  }

  function handleNewPostClick() {
    const element = document.getElementById("create-post");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSearchSubmit(event: React.FormEvent) {
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

          <PostList posts={posts} />
        </div>
      </main>
    </>
  );
}