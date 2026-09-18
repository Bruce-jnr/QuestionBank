import PageHero from '../components/PageHero'
import PublicLayout from '../components/PublicLayout'

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <PageHero title="Privacy Policy" text="How CBRUCENCLEX collects, uses, and protects information when you use the platform." />
      <article className="legal-page privacy-page">
        <p className="legal-updated">Effective September 18, 2026</p>
        <p>This policy applies to the CBRUCENCLEX website, student area, question bank, and related services. By using the platform, you acknowledge the practices described below.</p>

        <h2>1. Information we collect</h2>
        <p>We may collect information you provide directly, including your name, email address, account credentials, contact-form content, and comments submitted to the blog. Administrators may create student accounts on a student’s behalf.</p>
        <p>When you use the student area, we store study activity such as selected answers, session history, scores, completion status, time spent, topic selections, and performance summaries. We may also receive basic technical information needed to operate and secure the service, such as request timestamps, browser details, and IP addresses in server logs.</p>

        <h2>2. How we use information</h2>
        <ul>
          <li>Provide and secure student and administrator accounts.</li>
          <li>Deliver questions, save progress, calculate scores, and show performance insights.</li>
          <li>Respond to support requests and moderate submitted comments.</li>
          <li>Maintain, troubleshoot, and improve the platform.</li>
          <li>Prevent abuse, unauthorized access, and security incidents.</li>
          <li>Comply with applicable legal obligations.</li>
        </ul>

        <h2>3. Authentication and local storage</h2>
        <p>The application may store authentication tokens and limited account information in your browser’s local storage to keep you signed in. You can remove this information by signing out or clearing your browser data. Do not use a shared device without signing out when finished.</p>

        <h2>4. When information is shared</h2>
        <p>We do not sell personal information. Information may be processed by hosting, database, storage, security, or other service providers that help operate CBRUCENCLEX. We may also disclose information when required by law, to protect users or the platform, or as part of a business transfer.</p>
        <p>When the planned video pipeline is enabled, Zoom may provide recording data and Amazon Web Services may store and deliver video files. Their handling of information is also governed by their respective privacy terms.</p>

        <h2>5. Data retention and security</h2>
        <p>We retain information for as long as reasonably necessary to provide the service, maintain educational records, meet legal obligations, resolve disputes, and protect the platform. We use reasonable administrative and technical safeguards, but no internet service can guarantee absolute security.</p>

        <h2>6. Your choices</h2>
        <p>You may request access to, correction of, or deletion of personal information associated with your account, subject to applicable law and legitimate retention requirements. You may also ask an administrator to reset your password or disable your student account.</p>

        <h2>7. Children’s privacy</h2>
        <p>CBRUCENCLEX is intended for nursing students and adult learners. It is not directed to children under 13, and we do not knowingly collect personal information from children under 13.</p>

        <h2>8. External links and educational disclaimer</h2>
        <p>The platform may link to third-party websites. We are not responsible for their privacy practices. CBRUCENCLEX provides educational content and does not provide medical advice or replace professional clinical judgment.</p>

        <h2>9. Policy changes</h2>
        <p>We may update this policy as the service evolves. The effective date at the top of this page will be revised when material changes are published.</p>

        <h2>10. Contact us</h2>
        <p>For privacy questions or requests, use the <a href="/contact">Contact page</a>. Please do not include passwords or sensitive medical information in your message.</p>
      </article>
    </PublicLayout>
  )
}
