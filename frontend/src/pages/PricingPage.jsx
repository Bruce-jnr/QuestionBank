import PageHero from '../components/PageHero'
import PublicLayout from '../components/PublicLayout'

const plans = [
  { name: 'Free', description: 'Build your foundation and experience the platform.', features: ['Diagnostic readiness assessment', 'Selected practice questions', 'Public study guides', 'Basic session history'], action: 'Start free assessment', href: '/diagnostic' },
  { name: 'Premium', description: 'Unlock the complete learning experience.', features: ['Complete published question bank', 'All NGN question formats', 'Full performance insights', 'Premium video library when launched', 'Unlimited focused study sessions'], action: 'Request Premium access', href: '/contact', featured: true },
]

export default function PricingPage() {
  return <PublicLayout>
    <PageHero title="Choose your study access" text="Start with focused free resources, then unlock the complete question bank and upcoming video library with Premium." />
    <section className="pricing-page">
      <div className="pricing-grid">{plans.map((plan) => <article className={plan.featured ? 'featured' : ''} key={plan.name}>{plan.featured && <span className="pricing-kicker">Complete access</span>}<h2>{plan.name}</h2><p>{plan.description}</p><ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><a href={plan.href}>{plan.action}</a></article>)}</div>
      <p className="pricing-note">Premium access is currently managed by the CBRUCENCLEX administrator. Online subscription billing will be added separately.</p>
    </section>
  </PublicLayout>
}
