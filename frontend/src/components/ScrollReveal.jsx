import { useEffect, useRef, useState } from 'react'

export default function ScrollReveal({ as: Element = 'div', children, className = '', delay = 0, direction = 'up' }) {
  const elementRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element || !('IntersectionObserver' in window)) {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.14, rootMargin: '0px 0px -40px' })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <Element
      className={`scroll-reveal scroll-reveal-${direction} ${visible ? 'is-visible' : ''} ${className}`.trim()}
      ref={elementRef}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      {children}
    </Element>
  )
}
