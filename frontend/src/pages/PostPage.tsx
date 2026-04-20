import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Compass from "../components/Compass";
import Navbar from "../components/Navbar";
import { getPost, submitVote } from "../services/api";
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
    const [toast, setToast] = useState<ToastState>(null);

    useEffect(() => {
        if (!slug) return;
        loadInitialPost(slug);
    }, [slug]);

    async function loadInitialPost(currentSlug: string) {
        setLoading(true);
        const data = await getPost(currentSlug);
        setPost(data);
        setLoading(false);
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
        const updatedVote = await submitVote(slug, voterId, x, y);

        setPost((prev) => {
            if (!prev) return prev;
            const others = prev.votes.filter((v) => v.voter_id !== voterId);
            return { ...prev, votes: [...others, updatedVote] };
        });

        showToast("Your vote was updated", "success", 1600);
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
        return <main style={{ padding: "2rem" }}>Loading...</main>;
    }

    if (!post) {
        return <main style={{ padding: "2rem" }}>Post not found.</main>;
    }

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