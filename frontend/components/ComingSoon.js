import RequireAuth from './RequireAuth';

export default function ComingSoon({ title, body, priority }) {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl mb-3">{title}</h1>
        <p className="text-ink/60">{body}</p>
        <p className="text-sm text-ink/40 mt-6">{priority}</p>
      </div>
    </RequireAuth>
  );
}
