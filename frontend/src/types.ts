export type Vote = {
  id: number;
  voter_id: string;
  x: number;
  y: number;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  body: string;
  created_at: string;
  vote_count: number;
};

export type PostDetail = Post & {
  votes: Vote[];
};