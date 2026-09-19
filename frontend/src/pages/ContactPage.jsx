import { useState } from 'react';
import PageHero from '../components/PageHero';
import PublicLayout from '../components/PublicLayout';
import ButtonLoader from '../components/ButtonLoader';
import { sendContactMessage } from '../services/api';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true);
    setSent(false);
    setError('');
    try {
      await sendContactMessage(Object.fromEntries(data));
      setSent(true);
      form.reset();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <PublicLayout>
      <PageHero
        title="Get in Touch"
        text="Have questions about NCLEX prep? We are here to help."
      />
      <section className="page-section contact-grid">
        <form className="stacked-form contact-form" onSubmit={submit}>
          <h2>Send us a Message</h2>
          <label>
            Name
            <input name="name" required placeholder="Your name" />
          </label>
          <label>
            Email
            <input
              name="email"
              required
              type="email"
              placeholder="your.email@example.com"
            />
          </label>
          <label>
            Subject
            <input name="subject" required placeholder="What is this about?" />
          </label>
          <label>
            Message
            <textarea
              minLength="10"
              name="message"
              required
              placeholder="Tell us how we can help..."
            />
          </label>
          <label className="contact-honeypot" aria-hidden="true">
            Website
            <input autoComplete="off" name="website" tabIndex="-1" />
          </label>
          <button aria-busy={sending} disabled={sending} type="submit">
            <ButtonLoader loading={sending} loadingText="Sending...">
              Send Message
            </ButtonLoader>
          </button>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          {sent && (
            <p className="form-note">
              Thank you. Your message has been received.
            </p>
          )}
        </form>
        <div className="contact-info">
          <h2>Contact Information</h2>
          <p>We are here to support your NCLEX journey.</p>
          <article>
            <h3>Email Us</h3>
            <a href="mailto:support@cbrucenclex.com">support@cbrucenclex.com</a>
          </article>
          <article>
            <h3>Response Time</h3>
            <p>We typically respond within 24 hours during business days.</p>
          </article>
          <article>
            <h3>Support Hours</h3>
            <p>
              Monday-Friday: 9:00 AM-6:00 PM EST
              <br />
              Saturday: 10:00 AM-4:00 PM EST
              <br />
              Sunday: Closed
            </p>
          </article>
        </div>
      </section>
    </PublicLayout>
  );
}
