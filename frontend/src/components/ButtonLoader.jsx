export default function ButtonLoader({
  loading,
  children,
  loadingText = 'Please wait...',
}) {
  return (
    <>
      {loading && <span aria-hidden="true" className="button-spinner" />}
      <span>{loading ? loadingText : children}</span>
    </>
  );
}
