import PageHero from '../components/PageHero'
import PublicLayout from '../components/PublicLayout'

const faqGroups = [
  {
    title: 'Getting started',
    questions: [
      ['What is CBRUCENCLEX?', 'CBRUCENCLEX is an independent NCLEX preparation platform with study guides, practice questions, performance insights, and learning resources for nursing students.'],
      ['How do I access the question bank?', 'Use the Question Bank page to sign in with the student account provided by your administrator. Once signed in, you can create practice or test sessions by topic.'],
      ['Can I use CBRUCENCLEX on a phone or tablet?', 'Yes. The public site and student area are designed to work across phones, tablets, and desktop computers.'],
    ],
  },
  {
    title: 'Questions and study sessions',
    questions: [
      ['What question formats are supported?', 'The question bank supports traditional multiple choice, multiple response, and several Next Generation NCLEX formats, including cloze, matrix, hot spot, case study, bow-tie, and ordered-response questions. Some interactive formats may continue to receive interface improvements.'],
      ['What is the difference between Practice Mode and Test Mode?', 'Practice Mode provides feedback and rationales as you work. Test Mode saves feedback until the session is complete so the experience is closer to exam conditions.'],
      ['Is my progress saved?', 'Yes. Answers, completed sessions, scores, and performance summaries are stored with your student account so you can review your activity later.'],
      ['Are the study materials official NCLEX questions?', 'No. CBRUCENCLEX creates independent educational content for exam preparation and is not affiliated with or endorsed by the NCSBN or any nursing board.'],
    ],
  },
  {
    title: 'Accounts, videos, and support',
    questions: [
      ['I forgot my password. What should I do?', 'Contact your CBRUCENCLEX administrator. An administrator can issue a temporary password for your student account.'],
      ['When will video lessons be available?', 'A video library is being prepared for the student area. Recorded sessions will appear there when the secure Zoom recording and video-delivery pipeline is enabled.'],
      ['Can CBRUCENCLEX replace nursing school or clinical advice?', 'No. The platform is a study aid and does not provide medical, clinical, legal, or professional advice. Always follow your school, employer, licensing body, and current clinical guidance.'],
      ['How can I ask another question?', 'Send your question through the Contact page and include enough detail for the support team to help you.'],
    ],
  },
]

export default function FaqPage() {
  return (
    <PublicLayout>
      <PageHero title="Frequently Asked Questions" text="Quick answers about accounts, study sessions, question formats, and upcoming video lessons." />
      <section className="legal-page faq-page">
        {faqGroups.map((group) => (
          <section className="faq-group" key={group.title}>
            <h2>{group.title}</h2>
            <div className="faq-list">
              {group.questions.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <aside className="legal-contact-card">
          <div><span className="category-label">Still need help?</span><h2>We’re here to support your study journey.</h2></div>
          <a href="/contact">Contact us</a>
        </aside>
      </section>
    </PublicLayout>
  )
}
