import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Compass from "../components/Compass";
import Navbar from "../components/Navbar";
import { NotFoundError, RateLimitError, getPost, submitVote } from "../services/api";
import type { PostDetail } from "../types";
import { getOrCreateVoterId } from "../utils/compass";

type ToastState = {
    message: string;
    kind: "info" | "success";
} | null;

export default function PostPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [post, setPost] = useState<PostDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<"not_found" | "server" | null>(null);
    const [toast, setToast] = useState<ToastState>(null);

    useEffect(() => {
        if (!slug) return;
        loadInitialPost(slug);
    }, [slug]);

    useEffect(() => {
        if (post) document.title = `${post.title} — ChaoticMeter`;
        return () => { document.title = "ChaoticMeter — Where bad ideas get judged"; };
    }, [post]);

    async function loadInitialPost(currentSlug: string) {
        setLoading(true);
        setError(null);
        try {
            const data = await getPost(currentSlug);
            setPost(data);
        } catch (err) {
            setError(err instanceof NotFoundError ? "not_found" : "server");
        } finally {
            setLoading(false);
        }
    }

    function showToast(message: string, kind: "info" | "success" = "info", duration = 1500) {
        setToast({ message, kind });
        window.setTimeout(() => {
            setToast(null);
        }, duration);
    }

    async function handleVote(x: number, y: number) {
        if (!slug) return;

        const voterId = getOrCreateVoterId();

        try {
            const updatedVote = await submitVote(slug, voterId, x, y);
            setPost((prev) => {
                if (!prev) return prev;
                const others = prev.votes.filter((v) => v.voter_id !== voterId);
                return { ...prev, votes: [...others, updatedVote] };
            });
            showToast("Your vote was updated", "success", 1600);
        } catch (err) {
            if (err instanceof RateLimitError) {
                showToast("Too many votes — slow down a little", "info", 2500);
            } else {
                showToast("Vote didn't go through — try again", "info", 2000);
            }
        }
    }

    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast("Link copied", "success", 1500);
        } catch {
            showToast("Could not copy link", "info", 1500);
        }
    }

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

    function handleNewPostClick() {
        navigate("/", { state: { scrollToCreate: true } });
    }

    if (loading) {
        return (
            <main className="page-shell">
                <div className="page-container">
                    <div className="skeleton-header">
                        <div className="skeleton skeleton-title" />
                        <div className="skeleton skeleton-date" />
                        <div className="skeleton skeleton-body" />
                    </div>
                    <div className="skeleton skeleton-compass" />
                    <div className="skeleton skeleton-verdict" />
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <>
                <Navbar onNewPostClick={handleNewPostClick} />
                <main className="page-shell">
                    <div className="page-container error-state">
                        <p className="error-title">
                            {error === "not_found" ? "This post doesn't exist." : "Something went wrong."}
                        </p>
                        <p className="error-hint">
                            {error === "not_found" ? "It may have been removed or the link is wrong." : "The server might be down. Try again in a moment."}
                        </p>
                        <button className="primary-button" onClick={() => navigate("/")}>Back to home</button>
                    </div>
                </main>
            </>
        );
    }

    if (!post) return null;

    return (
        <>
            <Navbar onNewPostClick={handleNewPostClick} />

            <main className="page-shell">
                <div className="page-container">
                    <section className="post-page-header">
                        <h1 className="post-page-title">{post.title}</h1>
                        <p className="post-page-date">{formatPostDate(post.created_at)}</p>

                        {post.body ? <p className="post-page-body">{post.body}</p> : null}

                        <p className="post-page-hint">Drop your verdict on the compass below.</p>

                        <div className="post-page-actions">
                            <button className="primary-button share-button" onClick={handleCopyLink}>
                                Share this
                            </button>
                        </div>
                    </section>

                    <div className="compass-wrap">
                        <Compass votes={post.votes} onVote={handleVote} />

                        {toast && (
                            <div
                                className={`toast ${toast.kind === "success" ? "toast-success" : "toast-info"}`}
                            >
                                {toast.message}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}