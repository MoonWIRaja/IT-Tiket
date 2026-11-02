export function AuthShell({ children }) {
  return (
    <main className="auth-split">
      <section className="auth-brand">
        <strong>IT-Tiket</strong>
        <div>
          <h1>IT support, all in one place.</h1>
          <p>Raise a ticket, chat with IT and follow it through to resolution.</p>
        </div>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
