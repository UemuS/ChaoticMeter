import type { Post, PostDetail, Vote } from "../types";

const API_URL = "/api";

export async function getPosts(params?: {
  sort?: "new" | "top";
  search?: string;
}): Promise<Post[]> {
  const query = new URLSearchParams();

  if (params?.sort) {
    query.set("sort", params.sort);
  }

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const url = `${API_URL}/posts${query.toString() ? `?${query.toString()}` : ""}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }

  return response.json();
}

export async function createPost(title: string, body: string): Promise<Post> {
  const response = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body }),
  });

  if (!response.ok) {
    throw new Error("Failed to create post");
  }

  return response.json();
}

export async function getPost(slug: string): Promise<PostDetail> {
  const response = await fetch(`${API_URL}/posts/${slug}`);
  if (!response.ok) {
    throw new Error("Failed to fetch post");
  }

  return response.json();
}

export async function submitVote(
  slug: string,
  voterId: string,
  x: number,
  y: number
): Promise<Vote> {
  const response = await fetch(`${API_URL}/posts/${slug}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      voter_id: voterId,
      x,
      y,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to submit vote");
  }

  return response.json();
}