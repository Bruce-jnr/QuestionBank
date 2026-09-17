import { useState } from 'react'
import PageHero from '../components/PageHero'
import PublicLayout from '../components/PublicLayout'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  function submit(event) {
    event.preventDefault()
    setSent(true)
    event.currentTarget.reset()
  }

  return (
    <PublicLayout><PageHero title="Get in Touch" text="Have questions about NCLEX prep? We are here to help." /><section className="page-section contact-grid"><form className="stacked-form contact-form" onSubmit={submit}><h2>Send us a Message</h2><label>Name<input required placeholder="Your name" /></label><label>Email<input required type="email" placeholder="your.email@example.com" /></label><label>Subject<input required placeholder="What is this about?" /></label><label>Message<textarea required placeholder="Tell us how we can help..." /></label><button type="submit">Send Message</button>{sent && <p className="form-note">Thank you. Your message has been received.</p>}</form><div className="contact-info"><h2>Contact Information</h2><p>We are here to support your NCLEX journey.</p><article><h3>Email Us</h3><a href="mailto:support@nclexreview.com">support@nclexreview.com</a></article><article><h3>Response Time</h3><p>We typically respond within 24-48 hours during business days.</p></article><article><h3>Support Hours</h3><p>Monday-Friday: 9:00 AM-6:00 PM EST<br />Saturday: 10:00 AM-4:00 PM EST<br />Sunday: Closed</p></article></div></section></PublicLayout>
  )
}
