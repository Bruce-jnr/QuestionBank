import PublicLayout from '../components/PublicLayout'

export default function AboutPage() {
  return (
    <PublicLayout><section className="about-page"><img className="profile-image" src="/images/profile.jpg" alt="Cynthia Appiah" /><h1>Cynthia Appiah, BSN, RN</h1><p className="mission">Mission: Helping nurses pass the NCLEX.</p><div className="prose"><h2>Our Story</h2><p>After spending years as a registered nurse and seeing bright, capable students struggle with the pressure of the NCLEX, I created this academy to bridge the gap between nursing school and passing the exam. Every resource is practical, effective, and encouraging.</p><h2>Our Approach</h2><p>We believe in quality over quantity. Our approach uses evidence-based learning strategies and focuses on understanding core concepts instead of rote memorization.</p><ul><li><strong>Simplified concepts</strong> that make difficult topics approachable.</li><li><strong>Evidence-based strategies</strong> grounded in proven learning science.</li><li><strong>Student support</strong> for questions and shared experiences.</li><li><strong>Critical thinking</strong> that teaches you to think like a nurse.</li></ul></div><div className="cta-panel"><h2>Start Your Prep Journey</h2><p>Explore free study guides and join our community of future nurses.</p><a href="/study-guide">Explore Study Guides</a></div></section></PublicLayout>
  )
}
