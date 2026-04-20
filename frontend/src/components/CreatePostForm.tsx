import { useState } from "react";

type CreatePostFormProps = {
  onSubmit: (title: string, body: string) => Promise<void>;
};

export default function CreatePostForm({ onSubmit }: CreatePostFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(trimmedTitle, trimmedBody);
      setTitle("");
      setBody("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="create-post-section" id="create-post">
      <div className="section-heading">
        <h1 className="page-title">Put it on the compass</h1>
        <p className="page-subtitle">
          Drop a life choice, bad idea, or oddly specific behavior.
        </p>
      </div>

      <form className="create-post-form" onSubmit={handleSubmit}>
        <input
          className="create-post-input"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          maxLength={60}
        />

        <textarea
          className="create-post-textarea"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add some context if needed..."
          rows={4}
          maxLength={500}
        />

        <div className="create-post-footer">
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create post"}
          </button>

          <p className="create-post-hint">The title does the heavy lifting.</p>
        </div>
      </form>
    </section>
  );
}