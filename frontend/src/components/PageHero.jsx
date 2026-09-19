export default function PageHero({
  align = 'left',
  className: customClassName = '',
  image,
  imageAlt = '',
  title,
  text,
}) {
  const className = [
    'page-hero',
    image ? 'has-image' : '',
    align === 'center' ? 'is-centered' : '',
    customClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={className}>
      <div className="page-hero-content">
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {image && <img className="page-hero-image" src={image} alt={imageAlt} />}
    </section>
  );
}
