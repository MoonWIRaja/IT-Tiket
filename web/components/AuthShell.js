import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export function AuthShell({ children }) {
  return (
    <main className="auth-split">
      <section className="auth-brand">
        <i className="orb a" /><i className="orb b" />
        <Logo size={34} />
        <div>
          <h1>IT support, all in one place.</h1>
          <p>Raise a ticket, chat with IT and follow it through to resolution.</p>
        </div>
      </section>
      <section className="auth-panel"><ThemeToggle />{children}</section>
    </main>
  );
}
